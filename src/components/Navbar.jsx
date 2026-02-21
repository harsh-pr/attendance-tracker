import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import { useSemester } from "../context/SemesterContext";
import { useTheme } from "../context/ThemeContext";

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

  const [isSemesterMenuOpen, setIsSemesterMenuOpen] = useState(false);
  const [isCreateSemesterOpen, setIsCreateSemesterOpen] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [copySourceSemesterId, setCopySourceSemesterId] = useState("");
  const [timetableDraft, setTimetableDraft] = useState(EMPTY_TIMETABLE);
  const [subjectsDraft, setSubjectsDraft] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectType, setNewSubjectType] = useState("theory");

  const menuRef = useRef(null);

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
    if (!isTimetableOpen) return;

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
  }, [isTimetableOpen, currentTimetable, currentSemester.subjects]);

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center px-4 sm:px-6 h-14">
          <h1 className="sm:hidden absolute left-1/2 -translate-x-1/2 text-lg font-extrabold text-black dark:text-white font-[Poppins]">
            AttendanceManager
          </h1>

          <h1 className="hidden sm:block text-2xl font-extrabold tracking-tight text-black dark:text-white font-[Poppins]">
            AttendanceManager
          </h1>

          <div ref={menuRef} className="relative hidden sm:block ml-4">
            <button
              type="button"
              onClick={() => setIsSemesterMenuOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl border-0 border-none appearance-none shadow-none ring-0 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-sm font-medium min-w-40 inline-flex items-center gap-2"
            >
              <span className="truncate">{currentSemesterName}</span>
              <span
                className={`text-lg leading-none transition-transform duration-300 ${
                  isSemesterMenuOpen ? "rotate-0" : "-rotate-180"
                }`}
              >
                🡣
              </span>
            </button>

            {isSemesterMenuOpen ? (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-blue-200/60 dark:border-blue-700/60 bg-white/95 dark:bg-slate-900/95 shadow-[0_18px_45px_rgba(13,30,67,0.35)] backdrop-blur-xl overflow-hidden transform-gpu">
                {semesters.map((sem) => (
                  <button
                    key={sem.id}
                    type="button"
                    onClick={() => {
                      setCurrentSemesterId(sem.id);
                      setIsSemesterMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition ${
                      sem.id === currentSemesterId
                        ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {sem.name}
                  </button>
                ))}

                <div className="border-t border-gray-200 dark:border-gray-700" />
                <button
                  type="button"
                  onClick={openCreateSemesterModal}
                  className="w-full px-4 py-2 text-left text-sm text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  + Add new semester
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimetableOpen(true);
                    setIsSemesterMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  ✎ Edit timetable
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCurrentSemester}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  🗑 Delete this semester
                </button>
              </div>
            ) : null}
          </div>

          <nav className="hidden sm:flex items-center gap-4 ml-6">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/today">Detailed</NavItem>
            <NavItem to="/calendar">Calendar</NavItem>
          </nav>

          <div className="flex-1" />

          <button
            onClick={toggleTheme}
            className="hidden sm:flex relative w-14 h-7 rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300 cursor-pointer items-center"
          >
            <span
              className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs leading-none transition-all duration-300 ${
                theme === "dark" ? "translate-x-7" : ""
              }`}
            >
              {theme === "dark" ? "🌙" : "🌞"}
            </span>
          </button>
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

          <form onSubmit={submitSubjectCreate} className="grid grid-cols-1 sm:grid-cols-6 gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="sm:col-span-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="New subject name"
            />
            <select
              value={newSubjectType}
              onChange={(e) => setNewSubjectType(e.target.value)}
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="theory">theory</option>
              <option value="lab">lab</option>
            </select>
            <button type="submit" className="sm:col-span-1 px-3 py-2 rounded-lg bg-blue-600 text-white">
              + Subject
            </button>
          </form>



          {subjects.length ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
              <p className="text-sm font-medium">Subjects in {currentSemesterName}</p>
              <div className="space-y-1 max-h-40 overflow-auto pr-1">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2"
                  >
                    <div className="text-sm">
                      {subject.name}
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{subject.type}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDraftSubject(subject.id)}
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              No subjects in this semester yet. Add subjects first, then build timetable.
            </div>
          ) : (
            <div className="space-y-3 max-h-[65vh] overflow-auto pr-1">
              {(weekDays || Object.keys(DAY_LABELS)).map((dayKey) => {
                const lectures = timetableDraft[dayKey] || [];
                return (
                  <section key={dayKey} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{DAY_LABELS[dayKey]}</h3>
                      <button
                        type="button"
                        onClick={() => addLectureRow(dayKey)}
                        className="text-sm px-2 py-1 rounded-md bg-blue-600 text-white"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {lectures.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No lectures yet.</p>
                      ) : (
                        lectures.map((lecture, index) => (
                          <div
                            key={`${dayKey}-${index}`}
                            className="grid grid-cols-12 gap-2 items-center rounded-lg bg-gray-100 dark:bg-gray-800 p-2"
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
                              className="col-span-10 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
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
                              className="col-span-2 text-xs px-2 py-1 rounded bg-red-600 text-white"
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTimetableOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveTimetable}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              Save timetable
            </button>
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
        `
        px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 cursor-pointer
        ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      `
      }
    >
      {children}
    </NavLink>
  );
}