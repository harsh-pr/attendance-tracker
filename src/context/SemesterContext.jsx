/* eslint-disable react-refresh/only-export-components */
// src/context/SemesterContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SEMESTERS,
  DEFAULT_SEMESTER_ID,
} from "../data/defaultSemesters";
import { getLecturesForDate } from "../utils/timetableUtils";
import { getTodayDate, ensureDayExists } from "../store/attendanceStore";
import {
  loadAllData,
  saveMeta,
  saveAttendance,
  saveAllAttendance,
  saveSubjects,
  saveTimetables,
  saveReminders,
} from "../firebase/firestoreService";

const SemesterContext = createContext();

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const EMPTY_TIMETABLE = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

function cloneEmptyTimetable() {
  return JSON.parse(JSON.stringify(EMPTY_TIMETABLE));
}

function normalizeSemester(semester) {
  return {
    attendanceData: [],
    ...semester,
  };
}

function createSemesterId(semesters) {
  let index = semesters.length + 1;
  let candidate = `sem${index}`;
  while (semesters.some((s) => s.id === candidate)) {
    index += 1;
    candidate = `sem${index}`;
  }
  return candidate;
}

function slugifySubjectId(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "subject"
  );
}

function buildDefaultSubjectsBySemester() {
  return DEFAULT_SEMESTERS.reduce((acc, sem) => {
    acc[sem.id] = sem.subjects || [];
    return acc;
  }, {});
}

// ─── DEBOUNCE HELPER ──────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export function SemesterProvider({ children }) {
  const [semesters, setSemesters] = useState(
    DEFAULT_SEMESTERS.map(({ subjects, ...sem }) => normalizeSemester(sem))
  );
  const [currentSemesterId, setCurrentSemesterId] = useState(DEFAULT_SEMESTER_ID);
  const [subjectsBySemester, setSubjectsBySemester] = useState(
    buildDefaultSubjectsBySemester
  );
  const [timetablesBySemester, setTimetablesBySemester] = useState({});
  const [remindersBySemester, setRemindersBySemester] = useState({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Track which semesters have dirty attendance so we only save what changed
  const dirtyAttendanceRef = useRef(new Set());

  // ── LOAD on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadAllData();
        if (data) {
          const loadedSemesters = data.semesters.map(normalizeSemester);
          setSemesters(loadedSemesters);
          setSubjectsBySemester({
            ...buildDefaultSubjectsBySemester(),
            ...data.subjectsBySemester,
          });
          setTimetablesBySemester(data.timetablesBySemester || {});
          setRemindersBySemester(data.remindersBySemester || {});
          setCurrentSemesterId(
            loadedSemesters.some((s) => s.id === data.currentSemesterId)
              ? data.currentSemesterId
              : loadedSemesters[0]?.id || DEFAULT_SEMESTER_ID
          );
        }
        // If data is null (first time), defaults are already set — Firestore will be
        // populated when the user first makes a change.
      } catch (err) {
        console.error("Failed to load from Firestore:", err);
        setSaveError("Failed to load data. Using local defaults.");
      } finally {
        setHasLoaded(true);
      }
    };
    load();
  }, []);

  // ── DEBOUNCED VALUES (avoid hammering Firestore on every keystroke) ─────────
  const debouncedSemesters = useDebounce(semesters, 800);
  const debouncedCurrentSemesterId = useDebounce(currentSemesterId, 800);
  const debouncedSubjects = useDebounce(subjectsBySemester, 800);
  const debouncedTimetables = useDebounce(timetablesBySemester, 800);
  const debouncedReminders = useDebounce(remindersBySemester, 800);

  // ── SAVE META (semester list + active id) ──────────────────────────────────
  useEffect(() => {
    if (!hasLoaded) return;
    saveMeta(debouncedCurrentSemesterId, debouncedSemesters).catch((err) => {
      console.error("Failed to save meta:", err);
      setSaveError("Failed to sync semester list.");
    });
  }, [debouncedCurrentSemesterId, debouncedSemesters, hasLoaded]);

  // ── SAVE ATTENDANCE (only dirty semesters) ─────────────────────────────────
  useEffect(() => {
    if (!hasLoaded) return;
    const dirty = dirtyAttendanceRef.current;
    if (dirty.size === 0) return;

    const semestersToSave = debouncedSemesters.filter((s) => dirty.has(s.id));
    dirtyAttendanceRef.current = new Set();

    Promise.all(
      semestersToSave.map((s) => saveAttendance(s.id, s.attendanceData))
    ).catch((err) => {
      console.error("Failed to save attendance:", err);
      setSaveError("Failed to sync attendance.");
    });
  }, [debouncedSemesters, hasLoaded]);

  // ── SAVE SUBJECTS ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasLoaded) return;
    saveSubjects(debouncedSubjects).catch((err) => {
      console.error("Failed to save subjects:", err);
      setSaveError("Failed to sync subjects.");
    });
  }, [debouncedSubjects, hasLoaded]);

  // ── SAVE TIMETABLES ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasLoaded) return;
    saveTimetables(debouncedTimetables).catch((err) => {
      console.error("Failed to save timetables:", err);
      setSaveError("Failed to sync timetables.");
    });
  }, [debouncedTimetables, hasLoaded]);

  // ── SAVE REMINDERS ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasLoaded) return;
    saveReminders(debouncedReminders).catch((err) => {
      console.error("Failed to save reminders:", err);
      setSaveError("Failed to sync reminders.");
    });
  }, [debouncedReminders, hasLoaded]);

  // ── DERIVED STATE ──────────────────────────────────────────────────────────
  const baseCurrentSemester =
    semesters.find((s) => s.id === currentSemesterId) ||
    semesters[0] ||
    normalizeSemester(DEFAULT_SEMESTERS[0]);

  const currentSubjects = useMemo(
    () => subjectsBySemester[currentSemesterId] || [],
    [subjectsBySemester, currentSemesterId]
  );

  const currentTimetable = useMemo(
    () => timetablesBySemester[currentSemesterId] || cloneEmptyTimetable(),
    [timetablesBySemester, currentSemesterId]
  );

  const currentSemester = useMemo(
    () => ({
      ...baseCurrentSemester,
      subjects: currentSubjects,
      timetable: currentTimetable,
      reminders: remindersBySemester[currentSemesterId] || [],
    }),
    [baseCurrentSemester, currentSubjects, currentTimetable, remindersBySemester, currentSemesterId]
  );

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function normalizeDateString(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${parsed.getFullYear()}-${month}-${day}`;
  }

  function buildDayLectures(targetDate, semesterId, status) {
    const semMeta = semesters.find((s) => s.id === semesterId);
    const semWithData = {
      ...semMeta,
      subjects: subjectsBySemester[semesterId] || [],
      timetable: timetablesBySemester[semesterId] || cloneEmptyTimetable(),
    };
    return getLecturesForDate(targetDate, semWithData).map((l) => ({
      subjectId: l.subjectId,
      type: l.type,
      status,
    }));
  }

  function markDirtyAttendance(semesterId) {
    dirtyAttendanceRef.current.add(semesterId);
  }

  // ── SEMESTER CRUD ──────────────────────────────────────────────────────────
  function addSemester(name, options = {}) {
    const trimmedName = name?.trim();
    if (!trimmedName) return null;

    const newId = createSemesterId(semesters);
    const sourceSubjects = options.sourceSemesterId
      ? subjectsBySemester[options.sourceSemesterId] || []
      : [];

    const newSemester = { id: newId, name: trimmedName, attendanceData: [] };

    setSemesters((prev) => [...prev, newSemester]);
    setSubjectsBySemester((prev) => ({
      ...prev,
      [newId]: sourceSubjects.map((s) => ({ ...s })),
    }));
    setTimetablesBySemester((prev) => ({ ...prev, [newId]: cloneEmptyTimetable() }));
    setRemindersBySemester((prev) => ({ ...prev, [newId]: [] }));
    setCurrentSemesterId(newId);
    markDirtyAttendance(newId);
    return newId;
  }

  function deleteSemester(semesterId) {
    if (!semesterId || semesters.length <= 1) return;

    const nextId =
      semesterId === currentSemesterId
        ? semesters.find((s) => s.id !== semesterId)?.id || currentSemesterId
        : currentSemesterId;

    setSemesters((prev) => prev.filter((s) => s.id !== semesterId));
    setSubjectsBySemester((prev) => { const n = { ...prev }; delete n[semesterId]; return n; });
    setTimetablesBySemester((prev) => { const n = { ...prev }; delete n[semesterId]; return n; });
    setRemindersBySemester((prev) => { const n = { ...prev }; delete n[semesterId]; return n; });
    setCurrentSemesterId(nextId);
  }

  // ── SUBJECTS ───────────────────────────────────────────────────────────────
  function addSubject(name, type = "theory") {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    setSubjectsBySemester((prev) => {
      const existing = prev[currentSemesterId] || [];
      const base = slugifySubjectId(trimmedName);
      let nextId = base;
      let i = 2;
      while (existing.some((s) => s.id === nextId)) {
        nextId = `${base}_${i}`;
        i++;
      }
      return {
        ...prev,
        [currentSemesterId]: [
          ...existing,
          { id: nextId, name: trimmedName, type: type === "lab" ? "lab" : "theory" },
        ],
      };
    });
  }

  function removeSubject(subjectId) {
    if (!subjectId) return;

    setSubjectsBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: (prev[currentSemesterId] || []).filter((s) => s.id !== subjectId),
    }));

    setTimetablesBySemester((prev) => {
      const cur = prev[currentSemesterId] || cloneEmptyTimetable();
      return {
        ...prev,
        [currentSemesterId]: Object.fromEntries(
          Object.entries(cur).map(([day, lecs]) => [
            day,
            lecs.filter((l) => l.subjectId !== subjectId),
          ])
        ),
      };
    });

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id !== currentSemesterId
          ? sem
          : {
              ...sem,
              attendanceData: sem.attendanceData.map((day) => ({
                ...day,
                lectures: day.lectures.filter((l) => l.subjectId !== subjectId),
              })),
            }
      )
    );
    markDirtyAttendance(currentSemesterId);
  }

  function setSemesterSubjects(semesterId, nextSubjects = []) {
    const normalized = Array.isArray(nextSubjects)
      ? nextSubjects.map((s) => ({ id: s.id, name: s.name, type: s.type === "lab" ? "lab" : "theory" }))
      : [];

    const validIds = new Set(normalized.map((s) => s.id));

    setSubjectsBySemester((prev) => ({ ...prev, [semesterId]: normalized }));

    setTimetablesBySemester((prev) => {
      const cur = prev[semesterId] || cloneEmptyTimetable();
      return {
        ...prev,
        [semesterId]: Object.fromEntries(
          Object.entries(cur).map(([day, lecs]) => [
            day,
            lecs.filter((l) => validIds.has(l.subjectId)),
          ])
        ),
      };
    });

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id !== semesterId
          ? sem
          : {
              ...sem,
              attendanceData: sem.attendanceData.map((day) => ({
                ...day,
                lectures: day.lectures.filter((l) => validIds.has(l.subjectId)),
              })),
            }
      )
    );
    markDirtyAttendance(semesterId);
  }

  // ── TIMETABLE ──────────────────────────────────────────────────────────────
  function setSemesterTimetable(semesterId, timetable) {
    setTimetablesBySemester((prev) => ({
      ...prev,
      [semesterId]: {
        monday: timetable?.monday || [],
        tuesday: timetable?.tuesday || [],
        wednesday: timetable?.wednesday || [],
        thursday: timetable?.thursday || [],
        friday: timetable?.friday || [],
      },
    }));
  }

  // ── ATTENDANCE ─────────────────────────────────────────────────────────────
  function markDayStatus(date, status) {
    const targetDate = normalizeDateString(date);
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        let lectures = [];
        let dayType = null;

        if (status === "holiday" || status === "exam") {
          dayType = status;
        } else {
          lectures = buildDayLectures(targetDate, currentSemesterId, status);
        }

        const existing = sem.attendanceData.find((d) => d.date === targetDate);
        const newData = existing
          ? sem.attendanceData.map((d) =>
              d.date === targetDate ? { ...d, dayType, lectures } : d
            )
          : [...sem.attendanceData, { date: targetDate, dayType, lectures }];

        markDirtyAttendance(sem.id);
        return { ...sem, attendanceData: newData };
      })
    );
  }

  function removeDayAttendance(date) {
    const targetDate = normalizeDateString(date);
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        markDirtyAttendance(sem.id);
        return { ...sem, attendanceData: sem.attendanceData.filter((d) => d.date !== targetDate) };
      })
    );
  }

  function markTodayAttendance(subjectId, status) {
    const today = getTodayDate();
    ensureDayExists(currentSemester, today, currentSemesterId);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        markDirtyAttendance(sem.id);
        return {
          ...sem,
          attendanceData: sem.attendanceData.map((day) =>
            day.date === today
              ? {
                  ...day,
                  lectures: day.lectures.map((l) =>
                    l.subjectId === subjectId ? { ...l, status } : l
                  ),
                }
              : day
          ),
        };
      })
    );
  }

  // ── REMINDERS ─────────────────────────────────────────────────────────────
  function addReminder(reminder) {
    setRemindersBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: [...(prev[currentSemesterId] || []), reminder],
    }));
  }

  function updateReminder(reminderId, updates) {
    setRemindersBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: (prev[currentSemesterId] || []).map((r) =>
        r.id === reminderId ? { ...r, ...updates } : r
      ),
    }));
  }

  function removeReminder(reminderId) {
    setRemindersBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: (prev[currentSemesterId] || []).filter((r) => r.id !== reminderId),
    }));
  }

  // ── CONTEXT VALUE ──────────────────────────────────────────────────────────
  const contextValue = {
    semesters,
    currentSemester,
    currentSemesterId,
    currentTimetable,
    hasLoaded,
    isSaving,
    saveError,
    setCurrentSemesterId,
    addSemester,
    deleteSemester,
    addSubject,
    removeSubject,
    setSemesterSubjects,
    setSemesterTimetable,
    markTodayAttendance,
    markDayStatus,
    removeDayAttendance,
    addReminder,
    updateReminder,
    removeReminder,
    weekDays: WEEK_DAYS,
  };

  return (
    <SemesterContext.Provider value={contextValue}>
      {/* Loading overlay while Firestore data is being fetched */}
      {!hasLoaded ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
              Loading your data…
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  return useContext(SemesterContext);
}