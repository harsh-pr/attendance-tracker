/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SEMESTERS,
  DEFAULT_SEMESTER_ID,
} from "../data/defaultSemesters";
import { getLecturesForDate } from "../utils/timetableUtils";
import { getTodayDate, ensureDayExists } from "../store/attendanceStore";

const SemesterContext = createContext();

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];


const LOCAL_TIMETABLES_KEY = "attendance:timetables";

function readLocalJson(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures (private mode / blocked storage)
  }
}

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
  while (semesters.some((semester) => semester.id === candidate)) {
    index += 1;
    candidate = `sem${index}`;
  }
  return candidate;
}

function slugifySubjectId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "subject";
}

function buildDefaultSubjectsBySemester() {
  return DEFAULT_SEMESTERS.reduce((acc, sem) => {
    acc[sem.id] = sem.subjects || [];
    return acc;
  }, {});
}

export function SemesterProvider({ children }) {
  const [semesters, setSemesters] = useState(
    DEFAULT_SEMESTERS.map(({ subjects, ...semester }) => normalizeSemester(semester))
  );
  const [currentSemesterId, setCurrentSemesterId] = useState(DEFAULT_SEMESTER_ID);
  const [subjectsBySemester, setSubjectsBySemester] = useState(buildDefaultSubjectsBySemester);
  const [timetablesBySemester, setTimetablesBySemester] = useState({});
  const [remindersBySemester, setRemindersBySemester] = useState({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [apiAvailability, setApiAvailability] = useState({
    semesters: true,
    subjects: true,
    timetables: true,
    reminders: true,
  });

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [semRes, subjectRes, timetableRes, reminderRes] = await Promise.all([
          fetch("/api/semesters"),
          fetch("/api/subjects"),
          fetch("/api/timetables"),
          fetch("/api/reminders"),
        ]);

        if (!semRes.ok) throw new Error("Failed to load semesters");

        const semData = await semRes.json();
        const subjectData = subjectRes.ok ? await subjectRes.json() : { subjectsBySemester: {} };
        const timetableData = timetableRes.ok
          ? await timetableRes.json()
          : { timetables: readLocalJson(LOCAL_TIMETABLES_KEY, {}) };
        const reminderData = reminderRes.ok ? await reminderRes.json() : { reminders: {} };

        setApiAvailability({
          semesters: semRes.ok,
          subjects: subjectRes.ok,
          timetables: timetableRes.ok,
          reminders: reminderRes.ok,
        });

        const loadedSemesters = semData.semesters?.length
          ? semData.semesters.map(normalizeSemester)
          : DEFAULT_SEMESTERS.map(({ subjects, ...semester }) => normalizeSemester(semester));

        const mergedSubjects = {
          ...buildDefaultSubjectsBySemester(),
          ...(subjectData.subjectsBySemester || {}),
        };

        setSemesters(loadedSemesters);
        setSubjectsBySemester(mergedSubjects);
        setTimetablesBySemester(timetableData.timetables || {});
        setRemindersBySemester(reminderData.reminders || {});
        setCurrentSemesterId(
          loadedSemesters.some((s) => s.id === semData.currentSemesterId)
            ? semData.currentSemesterId
            : loadedSemesters[0]?.id || DEFAULT_SEMESTER_ID
        );
      } catch (error) {
        console.error("Failed to load app data.", error);
        setSemesters(DEFAULT_SEMESTERS.map(({ subjects, ...semester }) => normalizeSemester(semester)));
        setSubjectsBySemester(buildDefaultSubjectsBySemester());
        setCurrentSemesterId(DEFAULT_SEMESTER_ID);
        setApiAvailability({
          semesters: false,
          subjects: false,
          timetables: false,
          reminders: false,
        });
      } finally {
        setHasLoaded(true);
      }
    };

    loadAll();
  }, []);

  useEffect(() => {
    if (!hasLoaded || !apiAvailability.semesters) return;
    const save = async () => {
      try {
        const response = await fetch("/api/semesters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentSemesterId,
            semesters: semesters.map(({ id, name, attendanceData }) => ({
              id,
              name,
              attendanceData: attendanceData || [],
            })),
          }),
        });

        if (!response.ok) {
          console.error("Semesters sync failed. Disabling semesters autosave endpoint.");
          setApiAvailability((prev) => ({ ...prev, semesters: false }));
        }
      } catch (error) {
        console.error("Failed to sync attendance data.", error);
        setApiAvailability((prev) => ({ ...prev, semesters: false }));
      }
    };
    save();
  }, [currentSemesterId, semesters, hasLoaded, apiAvailability.semesters]);

  useEffect(() => {
    if (!hasLoaded || !apiAvailability.subjects) return;
    const save = async () => {
      try {
        const response = await fetch("/api/subjects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectsBySemester }),
        });

        if (!response.ok) {
          console.error("Subjects sync failed. Disabling subjects autosave endpoint.");
          setApiAvailability((prev) => ({ ...prev, subjects: false }));
        }
      } catch (error) {
        console.error("Failed to sync subject data.", error);
        setApiAvailability((prev) => ({ ...prev, subjects: false }));
      }
    };
    save();
  }, [subjectsBySemester, hasLoaded, apiAvailability.subjects]);

  useEffect(() => {
    if (!hasLoaded) return;

    writeLocalJson(LOCAL_TIMETABLES_KEY, timetablesBySemester);

    if (!apiAvailability.timetables) return;
    const save = async () => {
      try {
        const response = await fetch("/api/timetables", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timetables: timetablesBySemester }),
        });

        if (!response.ok) {
          console.error("Timetables sync failed. Disabling timetables autosave endpoint.");
          setApiAvailability((prev) => ({ ...prev, timetables: false }));
        }
      } catch (error) {
        console.error("Failed to sync timetable data.", error);
        setApiAvailability((prev) => ({ ...prev, timetables: false }));
      }
    };
    save();
  }, [timetablesBySemester, hasLoaded, apiAvailability.timetables]);

  useEffect(() => {
    if (!hasLoaded || !apiAvailability.reminders) return;
    const save = async () => {
      try {
        const response = await fetch("/api/reminders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reminders: remindersBySemester }),
        });

        if (!response.ok) {
          console.error("Reminders sync failed. Disabling reminders autosave endpoint.");
          setApiAvailability((prev) => ({ ...prev, reminders: false }));
        }
      } catch (error) {
        console.error("Failed to sync reminders data.", error);
        setApiAvailability((prev) => ({ ...prev, reminders: false }));
      }
    };
    save();
  }, [remindersBySemester, hasLoaded, apiAvailability.reminders]);

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

  function normalizeDateString(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${parsed.getFullYear()}-${month}-${day}`;
  }

  function buildDayLectures(targetDate, semesterId, status) {
    const semesterMeta = semesters.find((item) => item.id === semesterId);
    const semesterWithData = {
      ...semesterMeta,
      subjects: subjectsBySemester[semesterId] || [],
      timetable: timetablesBySemester[semesterId] || cloneEmptyTimetable(),
    };
    const schedule = getLecturesForDate(targetDate, semesterWithData);
    return schedule.map((lecture) => ({
      subjectId: lecture.subjectId,
      type: lecture.type,
      status,
    }));
  }


  async function persistTimetablesPayload(timetablesPayload) {
    writeLocalJson(LOCAL_TIMETABLES_KEY, timetablesPayload);

    try {
      const response = await fetch("/api/timetables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetables: timetablesPayload }),
      });

      if (response.ok) {
        setApiAvailability((prev) => ({ ...prev, timetables: true }));
        return;
      }

      if (response.status === 404 || response.status === 501) {
        setApiAvailability((prev) => ({ ...prev, timetables: false }));
      }

      console.error("Timetables sync failed.");
    } catch (error) {
      console.error("Failed to sync timetable data.", error);
    }
  }

  function addSemester(name, options = {}) {
    const trimmedName = name?.trim();
    if (!trimmedName) return null;

    const newSemesterId = createSemesterId(semesters);
    const sourceSemesterId = options.sourceSemesterId || null;
    const sourceSubjects = sourceSemesterId
      ? subjectsBySemester[sourceSemesterId] || []
      : [];

    const newSemester = {
      id: newSemesterId,
      name: trimmedName,
      attendanceData: [],
    };

    setSemesters((prev) => [...prev, newSemester]);
    setSubjectsBySemester((prev) => ({
      ...prev,
      [newSemesterId]: sourceSubjects.map((subject) => ({ ...subject })),
    }));
    setTimetablesBySemester((prev) => ({
      ...prev,
      [newSemesterId]: cloneEmptyTimetable(),
    }));
    setRemindersBySemester((prev) => ({
      ...prev,
      [newSemesterId]: [],
    }));
    setCurrentSemesterId(newSemesterId);
    return newSemesterId;
  }

  function deleteSemester(semesterId) {
    if (!semesterId || semesters.length <= 1) return;

    const nextSemesterId =
      semesterId === currentSemesterId
        ? semesters.find((semester) => semester.id !== semesterId)?.id || currentSemesterId
        : currentSemesterId;

    setSemesters((prev) => prev.filter((semester) => semester.id !== semesterId));

    setSubjectsBySemester((prev) => {
      const next = { ...prev };
      delete next[semesterId];
      return next;
    });

    setTimetablesBySemester((prev) => {
      const next = { ...prev };
      delete next[semesterId];
      return next;
    });

    setRemindersBySemester((prev) => {
      const next = { ...prev };
      delete next[semesterId];
      return next;
    });

    setCurrentSemesterId(nextSemesterId);
  }

  function addSubject(name, type = "theory") {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    setSubjectsBySemester((prev) => {
      const semesterSubjects = prev[currentSemesterId] || [];
      const base = slugifySubjectId(trimmedName);
      let nextId = base;
      let index = 2;
      while (semesterSubjects.some((subject) => subject.id === nextId)) {
        nextId = `${base}_${index}`;
        index += 1;
      }

      return {
        ...prev,
        [currentSemesterId]: [
          ...semesterSubjects,
          { id: nextId, name: trimmedName, type: type === "lab" ? "lab" : "theory" },
        ],
      };
    });
  }

  function removeSubject(subjectId) {
    if (!subjectId) return;

    setSubjectsBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: (prev[currentSemesterId] || []).filter((subject) => subject.id !== subjectId),
    }));

    setTimetablesBySemester((prev) => {
      const current = prev[currentSemesterId] || cloneEmptyTimetable();
      return {
        ...prev,
        [currentSemesterId]: {
          monday: (current.monday || []).filter((lecture) => lecture.subjectId !== subjectId),
          tuesday: (current.tuesday || []).filter((lecture) => lecture.subjectId !== subjectId),
          wednesday: (current.wednesday || []).filter((lecture) => lecture.subjectId !== subjectId),
          thursday: (current.thursday || []).filter((lecture) => lecture.subjectId !== subjectId),
          friday: (current.friday || []).filter((lecture) => lecture.subjectId !== subjectId),
        },
      };
    });

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id !== currentSemesterId
          ? sem
          : {
              ...sem,
              attendanceData: (sem.attendanceData || []).map((day) => ({
                ...day,
                lectures: (day.lectures || []).filter((lecture) => lecture.subjectId !== subjectId),
              })),
            }
      )
    );
  }

  function setSemesterSubjects(semesterId, nextSubjects = []) {
    const normalizedSubjects = Array.isArray(nextSubjects)
      ? nextSubjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          type: subject.type === "lab" ? "lab" : "theory",
        }))
      : [];

    const validSubjectIds = new Set(normalizedSubjects.map((subject) => subject.id));

    setSubjectsBySemester((prev) => ({
      ...prev,
      [semesterId]: normalizedSubjects,
    }));

    setTimetablesBySemester((prev) => {
      const current = prev[semesterId] || cloneEmptyTimetable();
      return {
        ...prev,
        [semesterId]: {
          monday: (current.monday || []).filter((lecture) => validSubjectIds.has(lecture.subjectId)),
          tuesday: (current.tuesday || []).filter((lecture) => validSubjectIds.has(lecture.subjectId)),
          wednesday: (current.wednesday || []).filter((lecture) => validSubjectIds.has(lecture.subjectId)),
          thursday: (current.thursday || []).filter((lecture) => validSubjectIds.has(lecture.subjectId)),
          friday: (current.friday || []).filter((lecture) => validSubjectIds.has(lecture.subjectId)),
        },
      };
    });

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id !== semesterId
          ? sem
          : {
              ...sem,
              attendanceData: (sem.attendanceData || []).map((day) => ({
                ...day,
                lectures: (day.lectures || []).filter((lecture) => validSubjectIds.has(lecture.subjectId)),
              })),
            }
      )
    );
  }

  function setSemesterTimetable(semesterId, timetable) {
    setTimetablesBySemester((prev) => {
      const next = {
        ...prev,
        [semesterId]: {
          monday: timetable?.monday || [],
          tuesday: timetable?.tuesday || [],
          wednesday: timetable?.wednesday || [],
          thursday: timetable?.thursday || [],
          friday: timetable?.friday || [],
        },
      };

      void persistTimetablesPayload(next);
      return next;
    });
  }

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

        const existingDay = sem.attendanceData.find((day) => day.date === targetDate);

        if (existingDay) {
          return {
            ...sem,
            attendanceData: sem.attendanceData.map((day) =>
              day.date === targetDate ? { ...day, dayType, lectures } : day
            ),
          };
        }

        return {
          ...sem,
          attendanceData: [...sem.attendanceData, { date: targetDate, dayType: null, lectures }],
        };
      })
    );
  }

  function removeDayAttendance(date) {
    const targetDate = normalizeDateString(date);
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id !== currentSemesterId
          ? sem
          : { ...sem, attendanceData: sem.attendanceData.filter((day) => day.date !== targetDate) }
      )
    );
  }

  function addReminder(reminder) {
    setRemindersBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: [...(prev[currentSemesterId] || []), reminder],
    }));
  }

  function updateReminder(reminderId, updates) {
    setRemindersBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: (prev[currentSemesterId] || []).map((item) =>
        item.id === reminderId ? { ...item, ...updates } : item
      ),
    }));
  }

  function removeReminder(reminderId) {
    setRemindersBySemester((prev) => ({
      ...prev,
      [currentSemesterId]: (prev[currentSemesterId] || []).filter((item) => item.id !== reminderId),
    }));
  }

  function markTodayAttendance(subjectId, status) {
    const today = getTodayDate();
    ensureDayExists(currentSemester, today, currentSemesterId);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        return {
          ...sem,
          attendanceData: sem.attendanceData.map((day) =>
            day.date === today
              ? {
                  ...day,
                  lectures: day.lectures.map((lec) =>
                    lec.subjectId === subjectId ? { ...lec, status } : lec
                  ),
                }
              : day
          ),
        };
      })
    );
  }

  const contextValue = {
    semesters,
    currentSemester,
    currentSemesterId,
    currentTimetable,
    setCurrentSemesterId,
    addSemester,
    deleteSemester,
    addSubject,
    removeSubject,
    setSemesterSubjects,
    setSemesterTimetable,
    markFullDayAttendance:
      typeof markFullDayAttendance === "function" ? markFullDayAttendance : () => {},
    markTodayAttendance:
      typeof markTodayAttendance === "function" ? markTodayAttendance : () => {},
    markDayStatus:
      typeof markDayStatus === "function" ? markDayStatus : () => {},
    markPartialDayAttendance:
      typeof markPartialDayAttendance === "function" ? markPartialDayAttendance : () => {},
    markDayLectureStatuses:
      typeof markDayLectureStatuses === "function" ? markDayLectureStatuses : () => {},
    removeDayAttendance:
      typeof removeDayAttendance === "function" ? removeDayAttendance : () => {},
    addReminder:
      typeof addReminder === "function" ? addReminder : () => {},
    updateReminder:
      typeof updateReminder === "function" ? updateReminder : () => {},
    removeReminder:
      typeof removeReminder === "function" ? removeReminder : () => {},
    weekDays: WEEK_DAYS,
  };

  return (
    <SemesterContext.Provider value={contextValue}>
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  return useContext(SemesterContext);
}