import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "./Modal";
import HoldButton from "./HoldButton";
import { useSemester } from "../context/SemesterContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { calculateOverallAttendance } from "../utils/attendanceUtils";

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

const EMPTY_TIMETABLE = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

export default function Navbar() {
  const {
    semesters,
    currentSemester,
    currentSemesterId,
    currentTimetable,
    setCurrentSemesterId,
    addSemester,
    deleteSemester,
    setSemesterTimetable,
    setSemesterSubjects,
    weekDays,
  } = useSemester();

  const { theme, toggleTheme } = useTheme();
  const { user, logout, connectGoogle, deleteAccount } = useAuth();

  const [isSemesterMenuOpen, setIsSemesterMenuOpen] = useState(false);
  const [isCreateSemesterOpen, setIsCreateSemesterOpen] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [copySourceSemesterId, setCopySourceSemesterId] = useState("");
  const [timetableDraft, setTimetableDraft] = useState(EMPTY_TIMETABLE);
  const [subjectsDraft, setSubjectsDraft] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectType, setNewSubjectType] = useState("theory");
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");

  // User Profile Dropdown Menu & Delete Account Modal State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDeleteAccountWarningOpen, setIsDeleteAccountWarningOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Click outside handlers
  useEffect(() => {
    function handleOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsSemesterMenuOpen(false);
      }
    }

    if (isSemesterMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isSemesterMenuOpen]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfileMenuOpen]);



  function openTimetableModal() {
    const semesterSubjects = (currentSemester.subjects || []).map((subject) => ({ ...subject }));
    setSubjectsDraft(semesterSubjects);

    const validIds = new Set(semesterSubjects.map((subject) => subject.id));
    const source = currentTimetable || EMPTY_TIMETABLE;
    setTimetableDraft({
      monday: (source.monday || []).filter((lecture) => validIds.has(lecture.subjectId)).map((lecture) => ({ ...lecture })),
      tuesday: (source.tuesday || []).filter((lecture) => validIds.has(lecture.subjectId)).map((lecture) => ({ ...lecture })),
      wednesday: (source.wednesday || []).filter((lecture) => validIds.has(lecture.subjectId)).map((lecture) => ({ ...lecture })),
      thursday: (source.thursday || []).filter((lecture) => validIds.has(lecture.subjectId)).map((lecture) => ({ ...lecture })),
      friday: (source.friday || []).filter((lecture) => validIds.has(lecture.subjectId)).map((lecture) => ({ ...lecture })),
    });
    setIsTimetableOpen(true);
    setIsSemesterMenuOpen(false);
  }

  const currentSemesterName = useMemo(
    () => semesters.find((sem) => sem.id === currentSemesterId)?.name || "Select semester",
    [semesters, currentSemesterId]
  );

  const subjects = subjectsDraft;
  const sortedSubjects = useMemo(
    () =>
      [...subjects].sort((a, b) => {
        if (a.type !== b.type) return a.type === "theory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [subjects]
  );

  function openCreateSemesterModal() {
    setNewSemesterName("");
    setCopySourceSemesterId("");
    setIsSemesterMenuOpen(false);
    setIsCreateSemesterOpen(true);
  }

  function submitCreateSemester(event) {
    event.preventDefault();
    if (!newSemesterName.trim()) return;
    addSemester(newSemesterName.trim(), { sourceSemesterId: copySourceSemesterId || null });
    setIsCreateSemesterOpen(false);
  }

  function addLectureRow(dayKey) {
    const fallbackSubjectId = subjects[0]?.id;
    if (!fallbackSubjectId) return;

    setTimetableDraft((prev) => ({
      ...prev,
      [dayKey]: [
        ...(prev[dayKey] || []),
        { subjectId: fallbackSubjectId, type: "theory" },
      ],
    }));
  }

  function updateLectureRow(dayKey, index, field, value) {
    setTimetableDraft((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map((lecture, i) =>
        i === index
          ? {
              ...lecture,
              [field]: value,
            }
          : lecture
      ),
    }));
  }

  function removeLectureRow(dayKey, index) {
    setTimetableDraft((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter((_, i) => i !== index),
    }));
  }

  function slugifySubjectId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "subject";
  }

  function saveSubjectsDraft() {
    if (typeof setSemesterSubjects === "function") {
      setSemesterSubjects(currentSemesterId, subjectsDraft);
    }
  }

  function saveTimetable() {
    const validIds = new Set(subjectsDraft.map((subject) => subject.id));

    const cleanedTimetable = {
      monday: (timetableDraft.monday || []).filter((lecture) => validIds.has(lecture.subjectId)),
      tuesday: (timetableDraft.tuesday || []).filter((lecture) => validIds.has(lecture.subjectId)),
      wednesday: (timetableDraft.wednesday || []).filter((lecture) => validIds.has(lecture.subjectId)),
      thursday: (timetableDraft.thursday || []).filter((lecture) => validIds.has(lecture.subjectId)),
      friday: (timetableDraft.friday || []).filter((lecture) => validIds.has(lecture.subjectId)),
    };

    saveSubjectsDraft();
    setSemesterTimetable(currentSemesterId, cleanedTimetable);
    setIsTimetableOpen(false);
  }

  function submitSubjectCreate(event) {
    event.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) return;

    setSubjectsDraft((prev) => {
      const base = slugifySubjectId(trimmed);
      let nextId = base;
      let index = 2;
      while (prev.some((subject) => subject.id === nextId)) {
        nextId = `${base}_${index}`;
        index += 1;
      }

      return [...prev, { id: nextId, name: trimmed, type: newSubjectType }];
    });

    setNewSubjectName("");
    setNewSubjectType("theory");
  }

  function removeDraftSubject(subjectId) {
    setSubjectsDraft((prev) => prev.filter((subject) => subject.id !== subjectId));
    setTimetableDraft((prev) => ({
      monday: (prev.monday || []).filter((lecture) => lecture.subjectId !== subjectId),
      tuesday: (prev.tuesday || []).filter((lecture) => lecture.subjectId !== subjectId),
      wednesday: (prev.wednesday || []).filter((lecture) => lecture.subjectId !== subjectId),
      thursday: (prev.thursday || []).filter((lecture) => lecture.subjectId !== subjectId),
      friday: (prev.friday || []).filter((lecture) => lecture.subjectId !== subjectId),
    }));
  }

  const { overall } = calculateOverallAttendance(currentSemester);
  const overallPercentage = overall?.percentage ?? 0;
  async function handleConnectGoogle() {
    try {
      await connectGoogle();
    } catch (err) {
      console.error(err);
      alert("Failed to connect Google account: " + err.message);
    }
  }
  function handleDeleteCurrentSemester() {
    if (semesters.length <= 1) {
      window.alert("At least one semester is required.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${currentSemesterName}? This will remove its attendance, subjects, timetable, and reminders.`
    );

    if (!confirmed) return;
    deleteSemester(currentSemesterId);
    setIsSemesterMenuOpen(false);
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-2 pb-1 bg-gradient-to-b from-white/90 via-white/80 to-transparent dark:from-zinc-950/90 dark:via-zinc-950/80 dark:to-transparent backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-14 px-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg shadow-black/5 dark:shadow-black/20 flex items-center justify-between backdrop-blur-xl">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white font-[Poppins] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              AttendanceManager
            </h1>

            {/* Semester Selector Menu */}
            <div ref={menuRef} className="relative hidden sm:block ml-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setIsSemesterMenuOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-700/60 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <span className="truncate max-w-[120px]">{currentSemesterName}</span>
                <span
                  className={`text-xs transition-transform duration-300 ${
                    isSemesterMenuOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </motion.button>

              <AnimatePresence>
                {isSemesterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-0 mt-2 w-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-2xl backdrop-blur-xl overflow-hidden z-50 p-2 space-y-1"
                  >
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Select Semester
                    </p>

                    {semesters.map((sem) => (
                      <button
                        key={sem.id}
                        type="button"
                        onClick={() => {
                          setCurrentSemesterId(sem.id);
                          setIsSemesterMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium transition ${
                          sem.id === currentSemesterId
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {sem.name}
                      </button>
                    ))}

                    <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
                    <button
                      type="button"
                      onClick={openCreateSemesterModal}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      + Add new semester
                    </button>
                    <button
                      type="button"
                      onClick={openTimetableModal}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                    >
                      ✎ Edit timetable
                    </button>

                    <div className="pt-1">
                      <HoldButton
                        onConfirm={handleDeleteCurrentSemester}
                        holdDuration={1500}
                        variant="danger"
                        icon="🗑️"
                        className="w-full text-xs"
                      >
                        Delete this semester
                      </HoldButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Kokonut Morphic Navbar Tabs */}
          <nav className="hidden sm:flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/50 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/40">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/today">Detailed</NavItem>
            <NavItem to="/calendar">Calendar</NavItem>
            <NavItem to="/ai-timetable">Class Timetable</NavItem>
          </nav>

          {/* Actions & Kokonut Profile Dropdown */}
          <div className="flex items-center gap-2">
            {/* THEME TOGGLE */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="hidden sm:flex relative w-12 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 transition-colors duration-300 cursor-pointer items-center p-0.5 border border-zinc-300 dark:border-zinc-700"
            >
              <motion.span
                animate={{ x: theme === "dark" ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white dark:bg-zinc-200 flex items-center justify-center text-[10px] leading-none shadow-sm"
              >
                {theme === "dark" ? "🌙" : "🌞"}
              </motion.span>
            </motion.button>

            {/* KOKONUT PROFILE DROPDOWN */}
            {user && (
              <div ref={profileMenuRef} className="relative inline-block text-left">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="relative p-0.5 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 cursor-pointer shadow-md"
                  aria-label="User profile menu"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "👤"}
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-72 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden z-[100] p-3 text-zinc-800 dark:text-zinc-200 space-y-2.5"
                    >
                      {/* Menu List matching Kokonut UI */}
                      <div className="space-y-1 text-xs font-semibold">
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors">
                          <span className="flex items-center gap-2">👤 Profile</span>
                          <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold truncate max-w-[120px]">
                            {user?.displayName || user?.email?.split("@")[0] || "User"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors">
                          <span className="flex items-center gap-2">⚡ Active Semester</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold truncate max-w-[100px]">
                            {currentSemesterName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors">
                          <span className="flex items-center gap-2">📊 Overall Attendance</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            overallPercentage >= 75
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}>
                            {overallPercentage}%
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={openTimetableModal}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-left cursor-pointer transition-colors"
                        >
                          <span className="flex items-center gap-2">✎ Edit Timetable</span>
                        </button>

                        {!user.providerData.some((p) => p.providerId === "google.com") && (
                          <button
                            type="button"
                            onClick={handleConnectGoogle}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-left text-blue-600 dark:text-blue-400 cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">🔗 Link Google Account</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-zinc-200 dark:border-zinc-800/80 my-1" />

                      {/* Profile Action Buttons: Normal Sign Out & Hold to Delete Account */}
                      <div className="space-y-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <span className="flex items-center gap-2">🚪 Sign Out</span>
                          <span className="text-[10px] text-zinc-400 font-medium">Click to exit</span>
                        </button>

                        <HoldButton
                          onConfirm={() => {
                            setIsProfileMenuOpen(false);
                            setIsDeleteAccountWarningOpen(true);
                          }}
                          holdDuration={1500}
                          variant="danger"
                          icon="⚠️"
                          className="w-full justify-between py-2 rounded-2xl"
                        >
                          Delete Account
                        </HoldButton>
                      </div>

                      {/* Kokonut UI Bottom Profile Footer Card */}
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl flex items-center justify-between border border-zinc-200/80 dark:border-zinc-700/50">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                            {user.displayName || "Attendance User"}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow">
                          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : "👤"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      <Modal open={isCreateSemesterOpen} onClose={() => setIsCreateSemesterOpen(false)} size="md">
        <form onSubmit={submitCreateSemester} className="space-y-4 text-gray-900 dark:text-gray-100">
          <h2 className="text-xl font-semibold">Create Semester</h2>
          <label className="block text-sm">
            Semester name
            <input
              value={newSemesterName}
              onChange={(e) => setNewSemesterName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              placeholder="Semester 3"
              required
            />
          </label>
          <label className="block text-sm">
            Copy subjects from semester (optional)
            <select
              value={copySourceSemesterId}
              onChange={(e) => setCopySourceSemesterId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="">Do not copy subjects</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Create semester
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={isTimetableOpen} onClose={() => setIsTimetableOpen(false)} size="xl" showCloseButton={false}>
        <div className="space-y-4 text-gray-900 dark:text-gray-100 max-h-[80vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Edit Timetable — {currentSemesterName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Weekly semester timetable. It will stay same until you edit again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTimetableOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700"
            >
              Close
            </button>
          </div>

          <form onSubmit={submitSubjectCreate} className="grid grid-cols-1 sm:grid-cols-6 gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/60">
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="sm:col-span-3 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New subject name"
            />
            <select
              value={newSubjectType}
              onChange={(e) => setNewSubjectType(e.target.value)}
              className="sm:col-span-2 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            >
              <option value="theory">theory</option>
              <option value="lab">lab</option>
            </select>
            <button type="submit" className="sm:col-span-1 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm">
              + Subject
            </button>
          </form>

          {subjects.length ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 bg-zinc-50 dark:bg-zinc-900/40">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Subjects in {currentSemesterName}</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 px-3 py-2 text-xs"
                  >
                    {editingSubjectId === subject.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingSubjectName}
                          onChange={(e) => setEditingSubjectName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Subject name"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = editingSubjectName.trim();
                            if (trimmed) {
                              setSubjectsDraft((prev) =>
                                prev.map((s) => (s.id === subject.id ? { ...s, name: trimmed } : s))
                              );
                              setEditingSubjectId(null);
                            }
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubjectId(null)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {subject.name}
                          <span className="ml-2 text-[10px] font-medium text-zinc-400">({subject.type})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubjectId(subject.id);
                              setEditingSubjectName(subject.name);
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDraftSubject(subject.id)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              No subjects in this semester yet. Add subjects first, then build timetable.
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {(weekDays || Object.keys(DAY_LABELS)).map((dayKey) => {
                const lectures = timetableDraft[dayKey] || [];
                return (
                  <section key={dayKey} className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-3 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{DAY_LABELS[dayKey]}</h3>
                      <button
                        type="button"
                        onClick={() => addLectureRow(dayKey)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {lectures.length === 0 ? (
                        <p className="text-xs text-zinc-400">No lectures scheduled.</p>
                      ) : (
                        lectures.map((lecture, index) => (
                          <div
                            key={`${dayKey}-${index}`}
                            className="grid grid-cols-12 gap-2 items-center rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 p-2 text-xs"
                          >
                            <select
                              value={lecture.subjectId}
                              onChange={(e) => {
                                const nextSubjectId = e.target.value;
                                const selectedSubject = sortedSubjects.find((subject) => subject.id === nextSubjectId);
                                updateLectureRow(dayKey, index, "subjectId", nextSubjectId);
                                updateLectureRow(
                                  dayKey,
                                  index,
                                  "type",
                                  selectedSubject?.type || lecture.type || "theory"
                                );
                              }}
                              className="col-span-9 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-medium"
                            >
                              {sortedSubjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name} ({subject.type})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeLectureRow(dayKey, index)}
                              className="col-span-3 text-[11px] px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsTimetableOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveTimetable}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-md"
            >
              Save timetable
            </button>
          </div>
        </div>
      </Modal>

      {/* DELETE ACCOUNT WARNING POPUP MODAL */}
      <Modal
        open={isDeleteAccountWarningOpen}
        onClose={() => {
          if (!isDeletingAccount) setIsDeleteAccountWarningOpen(false);
        }}
        size="md"
        showCloseButton={false}
      >
        <div className="space-y-4 text-center p-2">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center text-2xl mx-auto shadow-inner">
            ⚠️
          </div>

          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Permanently Delete Account?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Account: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user?.email}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-left text-xs space-y-2 text-red-700 dark:text-red-300">
            <p className="font-bold flex items-center gap-1.5 text-red-800 dark:text-red-200">
              <span>🚨</span> Warning: This action cannot be undone!
            </p>
            <ul className="list-disc list-inside space-y-1 opacity-90 text-[11px] font-medium">
              <li>All attendance history & analytics will be permanently deleted</li>
              <li>Semester subjects, weekly timetables & custom layouts erased</li>
              <li>Saved reminders, user preferences & metadata removed</li>
              <li>Your login account will be deleted from Firebase</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isDeletingAccount}
              onClick={() => setIsDeleteAccountWarningOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              Cancel, keep account
            </button>

            <HoldButton
              onConfirm={async () => {
                setIsDeletingAccount(true);
                try {
                  await deleteAccount();
                  setIsDeleteAccountWarningOpen(false);
                } catch (err) {
                  alert(err.message || "Failed to delete account.");
                } finally {
                  setIsDeletingAccount(false);
                }
              }}
              holdDuration={2000}
              variant="danger"
              icon="💣"
              className="w-full sm:w-auto py-2.5 rounded-xl justify-center font-bold text-xs"
            >
              {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
            </HoldButton>
          </div>
        </div>
      </Modal>
    </>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
          isActive
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="morphic-active-pill"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
            />
          )}
          <span className="relative z-10">{children}</span>
        </>
      )}
    </NavLink>
  );
}