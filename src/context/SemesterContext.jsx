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
  createTemporaryShareCode,
  peekShareCode,
  consumeShareCode,
  getCollegeTimetable,
  saveCollegeTimetable,
} from "../firebase/firestoreService";
import LoadingScreen from "../components/LoadingScreen";

const SemesterContext = createContext();
const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const EMPTY_TIMETABLE = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };

function cloneEmptyTimetable() {
  return JSON.parse(JSON.stringify(EMPTY_TIMETABLE));
}
function getLatestTimetable(timetableVal) {
  if (!timetableVal) return cloneEmptyTimetable();
  if (Array.isArray(timetableVal)) {
    if (timetableVal.length === 0) return cloneEmptyTimetable();
    const sorted = [...timetableVal].sort((a, b) => {
      const aDate = a.startFrom ? new Date(a.startFrom) : new Date(0);
      const bDate = b.startFrom ? new Date(b.startFrom) : new Date(0);
      return aDate - bDate;
    });
    return sorted[sorted.length - 1].timetable || cloneEmptyTimetable();
  }
  return timetableVal;
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

  const reloadAllData = async () => {
    setHasLoaded(false);
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
          loadedSemesters.length > 0
            ? loadedSemesters[loadedSemesters.length - 1].id
            : DEFAULT_SEMESTER_ID
        );
      } else {
        isFirestoreEmptyRef.current = true;
        setSemesters([]);
        setSubjectsBySemester({});
        setTimetablesBySemester({});
        setRemindersBySemester({});
        setCurrentSemesterId("");
      }
    } catch (err) {
      console.error("Failed to load from Firestore:", err);
      // On error, show defaults but don't save them (don't touch Firestore)
      // eslint-disable-next-line no-unused-vars
      const defaultSemesters = DEFAULT_SEMESTERS.map(({ subjects, ...sem }) => normalizeSemester(sem));
      const defaultSubjects = DEFAULT_SEMESTERS.reduce((acc, sem) => {
        acc[sem.id] = sem.subjects || [];
        return acc;
      }, {});
      setSemesters(defaultSemesters);
      setSubjectsBySemester(defaultSubjects);
      setTimetablesBySemester({});
      setRemindersBySemester({});
      setCurrentSemesterId(
        defaultSemesters.length > 0
          ? defaultSemesters[defaultSemesters.length - 1].id
          : DEFAULT_SEMESTER_ID
      );
    } finally {
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    reloadAllData();
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
    () => getLatestTimetable(timetablesBySemester[currentSemesterId]),
    [timetablesBySemester, currentSemesterId]
  );

  const currentSemester = useMemo(
    () => ({
      ...baseCurrentSemester,
      subjects: currentSubjects,
      timetable: currentTimetable,
      rawTimetable: timetablesBySemester[currentSemesterId],
      reminders: remindersBySemester[currentSemesterId] || [],
    }),
    [baseCurrentSemester, currentSubjects, currentTimetable, timetablesBySemester, remindersBySemester, currentSemesterId]
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
      slotIndex: l.slotIndex,
      status,
    }));
  }

  // ── SEMESTER CRUD ──────────────────────────────────────────────────────────
  function addSemester(name, options = {}) {
    const trimmedName = name?.trim();
    if (!trimmedName) return null;

    const newId = createSemesterId(semesters);
    let sourceSubjects = [];
    if (options.sourceSemesterId) {
      sourceSubjects = subjectsBySemester[options.sourceSemesterId] || [];
    } else if (options.subjects) {
      sourceSubjects = options.subjects;
    }

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
    let nextTimetableValue;
    if (Array.isArray(cur)) {
      nextTimetableValue = cur.map((v) => ({
        ...v,
        timetable: Object.fromEntries(
          Object.entries(v.timetable || EMPTY_TIMETABLE).map(([day, lecs]) => [
            day,
            lecs.filter((l) => l.subjectId !== subjectId),
          ])
        ),
      }));
    } else {
      nextTimetableValue = Object.fromEntries(
        Object.entries(cur).map(([day, lecs]) => [day, lecs.filter((l) => l.subjectId !== subjectId)])
      );
    }

    const nextTimetables = {
      ...timetablesBySemester,
      [currentSemesterId]: nextTimetableValue,
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

    setSubjectsDraftAction(currentSemesterId, nextSubjects[currentSemesterId]);
    setSubjectsBySemester(nextSubjects);
    setTimetablesBySemester(nextTimetables);
    setSemesters(nextSemesters);

    persistSubjects(nextSubjects);
    persistTimetables(nextTimetables);
    persistAttendance(currentSemesterId, nextSemesters.find((s) => s.id === currentSemesterId)?.attendanceData || []);
  }

  function setSubjectsDraftAction(semesterId, subjectsArr) {
    // dummy check in case Navbar is mounted, subjectsDraft will sync automatically next time openTimetableModal is called.
  }

  function setSemesterSubjects(semesterId, nextSubjectsArr = []) {
    const normalized = Array.isArray(nextSubjectsArr)
      ? nextSubjectsArr.map((s) => ({ id: s.id, name: s.name, type: s.type === "lab" ? "lab" : "theory" }))
      : [];
    const validIds = new Set(normalized.map((s) => s.id));

    const nextSubjects = { ...subjectsBySemester, [semesterId]: normalized };

    const cur = timetablesBySemester[semesterId] || cloneEmptyTimetable();
    let nextTimetableValue;
    if (Array.isArray(cur)) {
      nextTimetableValue = cur.map((v) => ({
        ...v,
        timetable: Object.fromEntries(
          Object.entries(v.timetable || EMPTY_TIMETABLE).map(([day, lecs]) => [
            day,
            lecs.filter((l) => validIds.has(l.subjectId)),
          ])
        ),
      }));
    } else {
      nextTimetableValue = Object.fromEntries(
        Object.entries(cur).map(([day, lecs]) => [day, lecs.filter((l) => validIds.has(l.subjectId))])
      );
    }

    const nextTimetables = {
      ...timetablesBySemester,
      [semesterId]: nextTimetableValue,
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
    const rawVal = timetablesBySemester[semesterId];
    const todayStr = getTodayDate();
    let nextVal;

    const cleanedTimetable = {
      monday: timetable?.monday || [],
      tuesday: timetable?.tuesday || [],
      wednesday: timetable?.wednesday || [],
      thursday: timetable?.thursday || [],
      friday: timetable?.friday || [],
      saturday: timetable?.saturday || [],
      sunday: timetable?.sunday || [],
    };

    let versions = [];
    if (Array.isArray(rawVal)) {
      versions = [...rawVal];
    } else if (rawVal && typeof rawVal === "object" && Object.keys(rawVal).length > 0) {
      versions = [{ startFrom: "1970-01-01", timetable: rawVal }];
    }

    const existingIndex = versions.findIndex((v) => v.startFrom === todayStr);
    if (existingIndex >= 0) {
      versions[existingIndex] = {
        ...versions[existingIndex],
        timetable: cleanedTimetable,
      };
    } else {
      if (versions.length === 0) {
        versions.push({ startFrom: "1970-01-01", timetable: cleanedTimetable });
      } else {
        versions.push({ startFrom: todayStr, timetable: cleanedTimetable });
      }
    }

    const nextTimetables = {
      ...timetablesBySemester,
      [semesterId]: versions,
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

  function markTodayAttendance(subjectId, status, slotIndex) {
    const today = getTodayDate();
    ensureDayExists(currentSemester, today);
    let updatedAttendance = [];

    const nextSemesters = semesters.map((sem) => {
      if (sem.id !== currentSemesterId) return sem;
      const newData = sem.attendanceData.map((day) => {
        if (day.date !== today) return day;
        const newLectures = day.lectures.map((l) => {
          // Match by both subjectId and slotIndex when slotIndex is available
          if (slotIndex != null) {
            return (l.subjectId === subjectId && l.slotIndex === slotIndex) ? { ...l, status } : l;
          }
          return l.subjectId === subjectId ? { ...l, status } : l;
        });
        return { ...day, lectures: newLectures };
      });
      updatedAttendance = newData;
      return { ...sem, attendanceData: newData };
    });

    setSemesters(nextSemesters);
    persistAttendance(currentSemesterId, updatedAttendance);
    persistMeta(currentSemesterId, nextSemesters);
  }

  function markDayLectureStatuses(date, selection) {
    const targetDate = normalizeDateString(date);
    let updatedAttendance = [];

    // Helper: build a composite key for looking up in the selection object
    const lectureKey = (l) => l.slotIndex != null ? `${l.subjectId}::${l.slotIndex}` : l.subjectId;

    const nextSemesters = semesters.map((sem) => {
      if (sem.id !== currentSemesterId) return sem;

      const existingIndex = sem.attendanceData.findIndex((d) => d.date === targetDate);
      let newLectures = [];
      if (existingIndex >= 0 && sem.attendanceData[existingIndex].lectures?.length > 0) {
        const existingDay = sem.attendanceData[existingIndex];
        newLectures = existingDay.lectures.map((l) => {
          const key = lectureKey(l);
          return {
            ...l,
            status: selection[key] !== undefined ? selection[key] : (l.status ?? "absent"),
          };
        });
      } else {
        const timetableLectures = getLecturesForDate(targetDate, currentSemester);
        newLectures = timetableLectures.map((l) => {
          const key = lectureKey(l);
          return {
            subjectId: l.subjectId,
            type: l.type,
            slotIndex: l.slotIndex,
            status: selection[key] !== undefined ? selection[key] : "absent",
          };
        });
      }

      let newData;
      if (existingIndex >= 0) {
        newData = sem.attendanceData.map((d) =>
          d.date === targetDate ? { ...d, dayType: null, lectures: newLectures } : d
        );
      } else {
        newData = [...sem.attendanceData, { date: targetDate, dayType: null, lectures: newLectures }];
      }

      updatedAttendance = newData;
      return { ...sem, attendanceData: newData };
    });

    setSemesters(nextSemesters);
    persistAttendance(currentSemesterId, updatedAttendance);
    persistMeta(currentSemesterId, nextSemesters);
  }

  function batchSavePastAttendance(newRecords) {
    if (!newRecords || newRecords.length === 0) return;
    let updatedAttendance = [];

    const nextSemesters = semesters.map((sem) => {
      if (sem.id !== currentSemesterId) return sem;

      const currentMap = new Map((sem.attendanceData || []).map((d) => [d.date, d]));
      newRecords.forEach((record) => {
        currentMap.set(record.date, record);
      });

      updatedAttendance = Array.from(currentMap.values());
      return { ...sem, attendanceData: updatedAttendance };
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

  // ── TIMETABLE SHARE & IMPORT FUNCTIONS ─────────────────────────────────────
  async function generateShareCodeForSemester({
    sourceSemesterId,
    includeSubjects = true,
    includeTimetable = true,
    includeCollegeTimetable = false,
  }) {
    const semId = sourceSemesterId || currentSemesterId;
    const targetSemObj = semesters.find((s) => s.id === semId);
    const sourceSemName = targetSemObj ? targetSemObj.name : semId;

    const subjects = includeSubjects ? (subjectsBySemester[semId] || []) : [];
    const timetable = includeTimetable ? getLatestTimetable(timetablesBySemester[semId]) : null;
    let collegeTimetableData = null;

    if (includeCollegeTimetable) {
      collegeTimetableData = await getCollegeTimetable(semId);
    }

    const payload = {
      sourceSemName,
      includeSubjects,
      includeTimetable,
      includeCollegeTimetable,
      subjects,
      timetable,
      collegeTimetable: collegeTimetableData,
    };

    return await createTemporaryShareCode(payload);
  }

  async function inspectSharedCode(code) {
    return await peekShareCode(code);
  }

  async function importSharedTimetable(code, targetSemesterId, options = { mode: "replace" }) {
    const semId = targetSemesterId || currentSemesterId;
    const payload = await consumeShareCode(code);

    const {
      subjects = [],
      timetable = null,
      collegeTimetable = null,
      includeSubjects = true,
      includeTimetable = true,
      includeCollegeTimetable = false,
    } = payload;

    if (includeSubjects && subjects.length > 0) {
      let nextSubjectsList = [];
      if (options.mode === "merge") {
        const existingSubjects = subjectsBySemester[semId] || [];
        const existingIds = new Set(existingSubjects.map((s) => s.id));
        const newUnique = subjects.filter((s) => !existingIds.has(s.id));
        nextSubjectsList = [...existingSubjects, ...newUnique];
      } else {
        nextSubjectsList = [...subjects];
      }
      const nextSubjects = {
        ...subjectsBySemester,
        [semId]: nextSubjectsList,
      };
      setSubjectsBySemester(nextSubjects);
      persistSubjects(nextSubjects);
    }

    if (includeTimetable && timetable) {
      const nextTimetables = {
        ...timetablesBySemester,
        [semId]: timetable,
      };
      setTimetablesBySemester(nextTimetables);
      persistTimetables(nextTimetables);
    }

    if (includeCollegeTimetable && collegeTimetable) {
      await saveCollegeTimetable(semId, collegeTimetable);
    }

    return payload;
  }

  // ── CONTEXT VALUE ──────────────────────────────────────────────────────────
  const contextValue = {
    semesters,
    currentSemester,
    currentSemesterId,
    currentTimetable,
    subjectsBySemester,
    timetablesBySemester,
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
    markDayLectureStatuses,
    removeDayAttendance,
    batchSavePastAttendance,
    addReminder,
    updateReminder,
    removeReminder,
    generateShareCodeForSemester,
    inspectSharedCode,
    importSharedTimetable,
    weekDays: WEEK_DAYS,
    remindersBySemester,
    reloadAllData,
  };

  return (
    <SemesterContext.Provider value={contextValue}>
      {!hasLoaded ? (
        <LoadingScreen
          items={[
            "Syncing semester schedules...",
            "Loading attendance records...",
            "Preparing your workspace...",
          ]}
        />
      ) : (
        children
      )}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  return useContext(SemesterContext);
}