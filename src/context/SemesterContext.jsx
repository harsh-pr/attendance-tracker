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
    subjects: [],
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

export function SemesterProvider({ children }) {
  const [semesters, setSemesters] = useState(DEFAULT_SEMESTERS.map(normalizeSemester));
  const [currentSemesterId, setCurrentSemesterId] = useState(DEFAULT_SEMESTER_ID);
  const [timetablesBySemester, setTimetablesBySemester] = useState({});
  const [remindersBySemester, setRemindersBySemester] = useState({});
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [semRes, timetableRes, reminderRes] = await Promise.all([
          fetch("/api/semesters"),
          fetch("/api/timetables"),
          fetch("/api/reminders"),
        ]);

        if (!semRes.ok) throw new Error("Failed to load semesters");

        const semData = await semRes.json();
        const timetableData = timetableRes.ok ? await timetableRes.json() : { timetables: {} };
        const reminderData = reminderRes.ok ? await reminderRes.json() : { reminders: {} };

        const loadedSemesters = semData.semesters?.length
          ? semData.semesters.map(normalizeSemester)
          : DEFAULT_SEMESTERS.map(normalizeSemester);

        setSemesters(loadedSemesters);
        setTimetablesBySemester(timetableData.timetables || {});
        setRemindersBySemester(reminderData.reminders || {});
        setCurrentSemesterId(
          loadedSemesters.some((s) => s.id === semData.currentSemesterId)
            ? semData.currentSemesterId
            : loadedSemesters[0]?.id || DEFAULT_SEMESTER_ID
        );
      } catch (error) {
        console.error("Failed to load app data.", error);
        setSemesters(DEFAULT_SEMESTERS.map(normalizeSemester));
        setCurrentSemesterId(DEFAULT_SEMESTER_ID);
      } finally {
        setHasLoaded(true);
      }
    };

    loadAll();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const save = async () => {
      try {
        await fetch("/api/semesters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentSemesterId, semesters }),
        });
      } catch (error) {
        console.error("Failed to sync attendance data.", error);
      }
    };
    save();
  }, [currentSemesterId, semesters, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;
    const save = async () => {
      try {
        await fetch("/api/timetables", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timetables: timetablesBySemester }),
        });
      } catch (error) {
        console.error("Failed to sync timetable data.", error);
      }
    };
    save();
  }, [timetablesBySemester, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;
    const save = async () => {
      try {
        await fetch("/api/reminders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reminders: remindersBySemester }),
        });
      } catch (error) {
        console.error("Failed to sync reminders data.", error);
      }
    };
    save();
  }, [remindersBySemester, hasLoaded]);

  const baseCurrentSemester =
    semesters.find((s) => s.id === currentSemesterId) ||
    semesters[0] ||
    normalizeSemester(DEFAULT_SEMESTERS[0]);

  const currentTimetable = useMemo(
    () => timetablesBySemester[currentSemesterId] || cloneEmptyTimetable(),
    [timetablesBySemester, currentSemesterId]
  );

  const currentSemester = useMemo(
    () => ({
      ...baseCurrentSemester,
      timetable: currentTimetable,
      reminders: remindersBySemester[currentSemesterId] || [],
    }),
    [baseCurrentSemester, currentTimetable, remindersBySemester, currentSemesterId]
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
      timetable: timetablesBySemester[semesterId] || cloneEmptyTimetable(),
    };
    const schedule = getLecturesForDate(targetDate, semesterWithData);
    return schedule.map((lecture) => ({
      subjectId: lecture.subjectId,
      type: lecture.type,
      status,
    }));
  }

  function addSemester(name, options = {}) {
    const trimmedName = name?.trim();
    if (!trimmedName) return null;

    const newSemesterId = createSemesterId(semesters);
    const copyFromCurrent = options.copySubjects !== false;
    const subjects = copyFromCurrent ? baseCurrentSemester.subjects : [];

    const newSemester = {
      id: newSemesterId,
      name: trimmedName,
      subjects,
      attendanceData: [],
    };

    setSemesters((prev) => [...prev, newSemester]);
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
          attendanceData: [...sem.attendanceData, { date: targetDate, dayType, lectures }],
        };
      })
    );
  }

  function markPartialDayAttendance(date, presentSubjectIds) {
    const targetDate = normalizeDateString(date);
    const selectedSubjectIds = new Set(presentSubjectIds);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        const existingDay = sem.attendanceData.find((day) => day.date === targetDate);
        const baseLectures = existingDay?.lectures?.length
          ? existingDay.lectures
          : buildDayLectures(targetDate, currentSemesterId, null);

        const lectures = baseLectures.map((lecture) => ({
          ...lecture,
          status: selectedSubjectIds.has(lecture.subjectId) ? "present" : "absent",
        }));

        if (existingDay) {
          return {
            ...sem,
            attendanceData: sem.attendanceData.map((day) =>
              day.date === targetDate ? { ...day, dayType: null, lectures } : day
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

  function markDayLectureStatuses(date, statusMap = {}) {
    const targetDate = normalizeDateString(date);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        const existingDay = sem.attendanceData.find((day) => day.date === targetDate);
        const baseLectures = existingDay?.lectures?.length
          ? existingDay.lectures
          : buildDayLectures(targetDate, currentSemesterId, null);

        const lectures = baseLectures.map((lecture) => {
          const nextStatus = statusMap[lecture.subjectId];
          return { ...lecture, status: nextStatus ?? lecture.status ?? null };
        });

        if (existingDay) {
          return {
            ...sem,
            attendanceData: sem.attendanceData.map((day) =>
              day.date === targetDate ? { ...day, dayType: null, lectures } : day
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

  function markFullDayAttendance(status, date) {
    const targetDate = date || getTodayDate();
    ensureDayExists(currentSemester, targetDate, currentSemesterId);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        return {
          ...sem,
          attendanceData: sem.attendanceData.map((day) =>
            day.date === targetDate
              ? { ...day, lectures: day.lectures.map((lec) => ({ ...lec, status })) }
              : day
          ),
        };
      })
    );
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

  return (
    <SemesterContext.Provider
      value={{
        semesters,
        currentSemester,
        currentSemesterId,
        currentTimetable,
        setCurrentSemesterId,
        addSemester,
        setSemesterTimetable,
        markFullDayAttendance,
        markTodayAttendance,
        markDayStatus,
        markPartialDayAttendance,
        markDayLectureStatuses,
        removeDayAttendance,
        addReminder,
        updateReminder,
        removeReminder,
        weekDays: WEEK_DAYS,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  return useContext(SemesterContext);
}