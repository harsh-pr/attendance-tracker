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
    setSemesterTimetable,
    weekDays,
  } = useSemester();

  const { theme, toggleTheme } = useTheme();

  const [isSemesterMenuOpen, setIsSemesterMenuOpen] = useState(false);
  const [isCreateSemesterOpen, setIsCreateSemesterOpen] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [copySubjects, setCopySubjects] = useState(true);
  const [timetableDraft, setTimetableDraft] = useState(EMPTY_TIMETABLE);

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
    const source = currentTimetable || EMPTY_TIMETABLE;
    setTimetableDraft({
      monday: [...(source.monday || [])],
      tuesday: [...(source.tuesday || [])],
      wednesday: [...(source.wednesday || [])],
      thursday: [...(source.thursday || [])],
      friday: [...(source.friday || [])],
    });
  }, [isTimetableOpen, currentTimetable]);

  const currentSemesterName = useMemo(
    () => semesters.find((sem) => sem.id === currentSemesterId)?.name || "Select semester",
    [semesters, currentSemesterId]
  );

  const subjects = currentSemester.subjects || [];

  function openCreateSemesterModal() {
    setNewSemesterName("");
    setCopySubjects(true);
    setIsSemesterMenuOpen(false);
    setIsCreateSemesterOpen(true);
  }

  function submitCreateSemester(event) {
    event.preventDefault();
    if (!newSemesterName.trim()) return;
    addSemester(newSemesterName.trim(), { copySubjects });
    setIsCreateSemesterOpen(false);
  }

  function addLectureRow(dayKey) {
    const fallbackSubjectId = subjects[0]?.id;
    if (!fallbackSubjectId) return;

    setTimetableDraft((prev) => ({
      ...prev,
      [dayKey]: [
        ...(prev[dayKey] || []),
        { subjectId: fallbackSubjectId, type: subjects[0].type || "theory" },
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
              ...(field === "subjectId"
                ? {
                    type:
                      subjects.find((subject) => subject.id === value)?.type ||
                      lecture.type ||
                      "theory",
                  }
                : {}),
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

  function saveTimetable() {
    setSemesterTimetable(currentSemesterId, timetableDraft);
    setIsTimetableOpen(false);
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
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-sm font-medium min-w-40 inline-flex items-center gap-2"
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={copySubjects}
              onChange={(e) => setCopySubjects(e.target.checked)}
            />
            Copy subjects from current semester
          </label>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Create semester
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={isTimetableOpen} onClose={() => setIsTimetableOpen(false)} size="xl" showCloseButton={false}>
        <div className="space-y-4 text-gray-900 dark:text-gray-100">
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

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              No subjects in this semester. Create semester with "Copy subjects" enabled first.
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
                              onChange={(e) =>
                                updateLectureRow(dayKey, index, "subjectId", e.target.value)
                              }
                              className="col-span-8 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            >
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name}
                                </option>
                              ))}
                            </select>
                            <span className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                              {lecture.type}
                            </span>
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