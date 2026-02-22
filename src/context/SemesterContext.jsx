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
  saveSubjects,
  saveTimetables,
  saveReminders,
} from "../firebase/firestoreService";

const SemesterContext = createContext();
const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const EMPTY_TIMETABLE = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] };

function cloneEmptyTimetable() {
  return JSON.parse(JSON.stringify(EMPTY_TIMETABLE));
}
function normalizeSemester(sem) {
  return { attendanceData: [], ...sem };
}
function createSemesterId(semesters) {
  let i = semesters.length + 1;
  let id = `sem${i}`;
  while (semesters.some((s) => s.id === id)) { i++; id = `sem${i}`; }
  return id;
}
function slugifySubjectId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "subject";
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export function SemesterProvider({ children }) {
  // ── STATE — starts completely empty, filled from Firestore ─────────────────
  const [semesters, setSemesters] = useState([]);
  const [currentSemesterId, setCurrentSemesterId] = useState(DEFAULT_SEMESTER_ID);
  const [subjectsBySemester, setSubjectsBySemester] = useState({});
  const [timetablesBySemester, setTimetablesBySemester] = useState({});
  const [remindersBySemester, setRemindersBySemester] = useState({});

  // hasLoaded: true once Firestore fetch completes (success or fail)
  const [hasLoaded, setHasLoaded] = useState(false);
  // isFirestoreEmpty: true if Firestore had no data (genuine first run)
  const isFirestoreEmptyRef = useRef(false);

  // ── LOAD on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadAllData();

        if (data) {
          // Firestore has real data — use it directly, no defaults merged
          const loadedSemesters = data.semesters.map(normalizeSemester);
          setSemesters(loadedSemesters);
          setSubjectsBySemester(data.subjectsBySemester || {});
          setTimetablesBySemester(data.timetablesBySemester || {});
          setRemindersBySemester(data.remindersBySemester || {});
          setCurrentSemesterId(
            loadedSemesters.some((s) => s.id === data.currentSemesterId)
              ? data.currentSemesterId
              : loadedSemesters[0]?.id || DEFAULT_SEMESTER_ID
          );
        } else {
          // Firestore is empty — first time user, load defaults
          isFirestoreEmptyRef.current = true;
          const defaultSemesters = DEFAULT_SEMESTERS.map(({ subjects, ...sem }) => normalizeSemester(sem));
          const defaultSubjects = DEFAULT_SEMESTERS.reduce((acc, sem) => {
            acc[sem.id] = sem.subjects || [];
            return acc;
          }, {});
          setSemesters(defaultSemesters);
          setSubjectsBySemester(defaultSubjects);
          setCurrentSemesterId(DEFAULT_SEMESTER_ID);
        }
      } catch (err) {
        console.error("Failed to load from Firestore:", err);
        // On error, show defaults but don't save them (don't touch Firestore)
        const defaultSemesters = DEFAULT_SEMESTERS.map(({ subjects, ...sem }) => normalizeSemester(sem));
        const defaultSubjects = DEFAULT_SEMESTERS.reduce((acc, sem) => {
          acc[sem.id] = sem.subjects || [];
          return acc;
        }, {});
        setSemesters(defaultSemesters);
        setSubjectsBySemester(defaultSubjects);
        setCurrentSemesterId(DEFAULT_SEMESTER_ID);
      } finally {
        setHasLoaded(true);
      }
    };
    load();
  }, []);

  // ── EXPLICIT SAVE HELPERS ──────────────────────────────────────────────────
  // These are called directly from mutation functions — never automatically.

  function persistMeta(nextCurrentId, nextSemesters) {
    saveMeta(nextCurrentId, nextSemesters).catch((err) =>
      console.error("Failed to save meta:", err)
    );
  }

  function persistAttendance(semesterId, attendanceData) {
    saveAttendance(semesterId, attendanceData).catch((err) =>
      console.error("Failed to save attendance:", err)
    );
  }

  function persistSubjects(nextSubjects) {
    saveSubjects(nextSubjects).catch((err) =>
      console.error("Failed to save subjects:", err)
    );
  }

  function persistTimetables(nextTimetables) {
    saveTimetables(nextTimetables).catch((err) =>
      console.error("Failed to save timetables:", err)
    );
  }

  function persistReminders(nextReminders) {
    saveReminders(nextReminders).catch((err) =>
      console.error("Failed to save reminders:", err)
    );
  }

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

  // ── SEMESTER CRUD ──────────────────────────────────────────────────────────
  function addSemester(name, options = {}) {
    const trimmedName = name?.trim();
    if (!trimmedName) return null;

    const newId = createSemesterId(semesters);
    const sourceSubjects = options.sourceSemesterId
      ? subjectsBySemester[options.sourceSemesterId] || []
      : [];

    const newSemester = { id: newId, name: trimmedName, attendanceData: [] };
    const nextSemesters = [...semesters, newSemester];
    const nextSubjects = { ...subjectsBySemester, [newId]: sourceSubjects.map((s) => ({ ...s })) };
    const nextTimetables = { ...timetablesBySemester, [newId]: cloneEmptyTimetable() };
    const nextReminders = { ...remindersBySemester, [newId]: [] };

    setSemesters(nextSemesters);
    setSubjectsBySemester(nextSubjects);
    setTimetablesBySemester(nextTimetables);
    setRemindersBySemester(nextReminders);
    setCurrentSemesterId(newId);

    persistMeta(newId, nextSemesters);
    persistSubjects(nextSubjects);
    persistTimetables(nextTimetables);
    persistReminders(nextReminders);
    return newId;
  }

  function deleteSemester(semesterId) {
    if (!semesterId || semesters.length <= 1) return;

    const nextId =
      semesterId === currentSemesterId
        ? semesters.find((s) => s.id !== semesterId)?.id || currentSemesterId
        : currentSemesterId;

    const nextSemesters = semesters.filter((s) => s.id !== semesterId);
    const nextSubjects = { ...subjectsBySemester };
    const nextTimetables = { ...timetablesBySemester };
    const nextReminders = { ...remindersBySemester };
    delete nextSubjects[semesterId];
    delete nextTimetables[semesterId];
    delete nextReminders[semesterId];

    setSemesters(nextSemesters);
    setSubjectsBySemester(nextSubjects);
    setTimetablesBySemester(nextTimetables);
    setRemindersBySemester(nextReminders);
    setCurrentSemesterId(nextId);

    persistMeta(nextId, nextSemesters);
    persistSubjects(nextSubjects);
    persistTimetables(nextTimetables);
    persistReminders(nextReminders);
  }

  // ── SUBJECTS ───────────────────────────────────────────────────────────────
  function addSubject(name, type = "theory") {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    const existing = subjectsBySemester[currentSemesterId] || [];
    const base = slugifySubjectId(trimmedName);
    let nextId = base;
    let i = 2;
    while (existing.some((s) => s.id === nextId)) { nextId = `${base}_${i}`; i++; }

    const nextSubjects = {
      ...subjectsBySemester,
      [currentSemesterId]: [...existing, { id: nextId, name: trimmedName, type: type === "lab" ? "lab" : "theory" }],
    };
    setSubjectsBySemester(nextSubjects);
    persistSubjects(nextSubjects);
  }

  function removeSubject(subjectId) {
    if (!subjectId) return;

    const nextSubjects = {
      ...subjectsBySemester,
      [currentSemesterId]: (subjectsBySemester[currentSemesterId] || []).filter((s) => s.id !== subjectId),
    };

    const cur = timetablesBySemester[currentSemesterId] || cloneEmptyTimetable();
    const nextTimetables = {
      ...timetablesBySemester,
      [currentSemesterId]: Object.fromEntries(
        Object.entries(cur).map(([day, lecs]) => [day, lecs.filter((l) => l.subjectId !== subjectId)])
      ),
    };

    const nextSemesters = semesters.map((sem) =>
      sem.id !== currentSemesterId ? sem : {
        ...sem,
        attendanceData: sem.attendanceData.map((day) => ({
          ...day,
          lectures: day.lectures.filter((l) => l.subjectId !== subjectId),
        })),
      }
    );

    setSubjectsBySemester(nextSubjects);
    setTimetablesBySemester(nextTimetables);
    setSemesters(nextSemesters);

    persistSubjects(nextSubjects);
    persistTimetables(nextTimetables);
    persistAttendance(currentSemesterId, nextSemesters.find((s) => s.id === currentSemesterId)?.attendanceData || []);
  }

  function setSemesterSubjects(semesterId, nextSubjectsArr = []) {
    const normalized = Array.isArray(nextSubjectsArr)
      ? nextSubjectsArr.map((s) => ({ id: s.id, name: s.name, type: s.type === "lab" ? "lab" : "theory" }))
      : [];
    const validIds = new Set(normalized.map((s) => s.id));

    const nextSubjects = { ...subjectsBySemester, [semesterId]: normalized };

    const cur = timetablesBySemester[semesterId] || cloneEmptyTimetable();
    const nextTimetables = {
      ...timetablesBySemester,
      [semesterId]: Object.fromEntries(
        Object.entries(cur).map(([day, lecs]) => [day, lecs.filter((l) => validIds.has(l.subjectId))])
      ),
    };

    const nextSemesters = semesters.map((sem) =>
      sem.id !== semesterId ? sem : {
        ...sem,
        attendanceData: sem.attendanceData.map((day) => ({
          ...day,
          lectures: day.lectures.filter((l) => validIds.has(l.subjectId)),
        })),
      }
    );

    setSubjectsBySemester(nextSubjects);
    setTimetablesBySemester(nextTimetables);
    setSemesters(nextSemesters);

    persistSubjects(nextSubjects);
    persistTimetables(nextTimetables);
    persistAttendance(semesterId, nextSemesters.find((s) => s.id === semesterId)?.attendanceData || []);
  }

  // ── TIMETABLE ──────────────────────────────────────────────────────────────
  function setSemesterTimetable(semesterId, timetable) {
    const nextTimetables = {
      ...timetablesBySemester,
      [semesterId]: {
        monday: timetable?.monday || [],
        tuesday: timetable?.tuesday || [],
        wednesday: timetable?.wednesday || [],
        thursday: timetable?.thursday || [],
        friday: timetable?.friday || [],
      },
    };
    setTimetablesBySemester(nextTimetables);
    persistTimetables(nextTimetables);
  }

  // ── ATTENDANCE ─────────────────────────────────────────────────────────────
  function markDayStatus(date, status) {
    const targetDate = normalizeDateString(date);
    let updatedAttendance = [];

    const nextSemesters = semesters.map((sem) => {
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
        ? sem.attendanceData.map((d) => d.date === targetDate ? { ...d, dayType, lectures } : d)
        : [...sem.attendanceData, { date: targetDate, dayType, lectures }];

      updatedAttendance = newData;
      return { ...sem, attendanceData: newData };
    });

    setSemesters(nextSemesters);
    persistAttendance(currentSemesterId, updatedAttendance);
    persistMeta(currentSemesterId, nextSemesters);
  }

  function removeDayAttendance(date) {
    const targetDate = normalizeDateString(date);
    let updatedAttendance = [];

    const nextSemesters = semesters.map((sem) => {
      if (sem.id !== currentSemesterId) return sem;
      updatedAttendance = sem.attendanceData.filter((d) => d.date !== targetDate);
      return { ...sem, attendanceData: updatedAttendance };
    });

    setSemesters(nextSemesters);
    persistAttendance(currentSemesterId, updatedAttendance);
    persistMeta(currentSemesterId, nextSemesters);
  }

  function markTodayAttendance(subjectId, status) {
    const today = getTodayDate();
    ensureDayExists(currentSemester, today, currentSemesterId);
    let updatedAttendance = [];

    const nextSemesters = semesters.map((sem) => {
      if (sem.id !== currentSemesterId) return sem;
      const newData = sem.attendanceData.map((day) =>
        day.date === today
          ? { ...day, lectures: day.lectures.map((l) => l.subjectId === subjectId ? { ...l, status } : l) }
          : day
      );
      updatedAttendance = newData;
      return { ...sem, attendanceData: newData };
    });

    setSemesters(nextSemesters);
    persistAttendance(currentSemesterId, updatedAttendance);
    persistMeta(currentSemesterId, nextSemesters);
  }

  // ── REMINDERS ─────────────────────────────────────────────────────────────
  function addReminder(reminder) {
    const nextReminders = {
      ...remindersBySemester,
      [currentSemesterId]: [...(remindersBySemester[currentSemesterId] || []), reminder],
    };
    setRemindersBySemester(nextReminders);
    persistReminders(nextReminders);
  }

  function updateReminder(reminderId, updates) {
    const nextReminders = {
      ...remindersBySemester,
      [currentSemesterId]: (remindersBySemester[currentSemesterId] || []).map((r) =>
        r.id === reminderId ? { ...r, ...updates } : r
      ),
    };
    setRemindersBySemester(nextReminders);
    persistReminders(nextReminders);
  }

  function removeReminder(reminderId) {
    const nextReminders = {
      ...remindersBySemester,
      [currentSemesterId]: (remindersBySemester[currentSemesterId] || []).filter((r) => r.id !== reminderId),
    };
    setRemindersBySemester(nextReminders);
    persistReminders(nextReminders);
  }

  // ── CONTEXT VALUE ──────────────────────────────────────────────────────────
  const contextValue = {
    semesters,
    currentSemester,
    currentSemesterId,
    currentTimetable,
    hasLoaded,
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