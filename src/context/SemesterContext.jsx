/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_SEMESTERS,
  DEFAULT_SEMESTER_ID,
} from "../data/defaultSemesters";
import { SEMESTER_TIMETABLES } from "../data/timetable";
import { getLecturesForDate } from "../utils/timetableUtils";
import { getTodayDate, ensureDayExists } from "../store/attendanceStore";

const SemesterContext = createContext();

const EMPTY_TIMETABLE = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

function normalizeSemester(semester) {
  return {
    attendanceData: [],
    reminders: [],
    ...semester,
    timetable:
      semester.timetable ||
      SEMESTER_TIMETABLES[semester.id] ||
      EMPTY_TIMETABLE,
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
  const [semesters, setSemesters] = useState(DEFAULT_SEMESTERS);
  const [currentSemesterId, setCurrentSemesterId] = useState(
    DEFAULT_SEMESTER_ID
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadSemesters = async () => {
      try {
        const response = await fetch("/api/semesters");
        if (!response.ok) {
          throw new Error("Failed to load semesters");
        }
        const data = await response.json();
        const loadedSemesters = data.semesters?.length
          ? data.semesters.map(normalizeSemester)
          : DEFAULT_SEMESTERS.map(normalizeSemester);
        setSemesters(loadedSemesters);
        setCurrentSemesterId(
          loadedSemesters.some(
            (semester) => semester.id === data.currentSemesterId
          )
            ? data.currentSemesterId
            : loadedSemesters[0]?.id || DEFAULT_SEMESTER_ID
        );
      } catch (error) {
        console.error("Failed to load attendance data.", error);
        setSemesters(DEFAULT_SEMESTERS.map(normalizeSemester));
        setCurrentSemesterId(DEFAULT_SEMESTER_ID);
      } finally {
        setHasLoaded(true);
      }
    };

    loadSemesters();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    const saveSemesters = async () => {
      try {
        await fetch("/api/semesters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentSemesterId,
            semesters,
          }),
        });
      } catch (error) {
        console.error("Failed to sync attendance data.", error);
      }
    };

    saveSemesters();
  }, [currentSemesterId, semesters, hasLoaded]);

  const currentSemester =
    semesters.find((s) => s.id === currentSemesterId) ||
    semesters[0] ||
    normalizeSemester(DEFAULT_SEMESTERS[0]);

  /* ===== ENSURE DAY ENTRY FROM TIMETABLE ===== */
  function normalizeDateString(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return dateString;
    }
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${parsed.getFullYear()}-${month}-${day}`;
  }

  function buildDayLectures(targetDate, semesterId, status) {
    const semester = semesters.find((item) => item.id === semesterId);
    const schedule = getLecturesForDate(targetDate, semester, semesters);
    return schedule.map((lecture) => ({
      subjectId: lecture.subjectId,
      type: lecture.type,
      status,
    }));
  }

  function addSemester(name) {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    setSemesters((prev) => {
      const newSemesterId = createSemesterId(prev);
      const newSemester = {
        id: newSemesterId,
        name: trimmedName,
        subjects: currentSemester.subjects.map((subject) => ({
          ...subject,
        })),
        attendanceData: [],
        reminders: [],
        timetable: JSON.parse(
          JSON.stringify(currentSemester.timetable || EMPTY_TIMETABLE)
        ),
      };

      setCurrentSemesterId(newSemesterId);
      return [...prev, newSemester];
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

        const existingDay = sem.attendanceData.find(
          (day) => day.date === targetDate
        );

        if (existingDay) {
          return {
            ...sem,
            attendanceData: sem.attendanceData.map((day) =>
              day.date === targetDate
                ? {
                    ...day,
                    dayType,
                    lectures,
                  }
                : day
            ),
          };
        }

        return {
          ...sem,
          attendanceData: [
            ...sem.attendanceData,
            {
              date: targetDate,
              dayType,
              lectures,
            },
          ],
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

        const existingDay = sem.attendanceData.find(
          (day) => day.date === targetDate
        );
        const baseLectures =
          existingDay?.lectures?.length
            ? existingDay.lectures
            : buildDayLectures(targetDate, currentSemesterId, null);

        const lectures = baseLectures.map((lecture) => ({
          ...lecture,
          status: selectedSubjectIds.has(lecture.subjectId)
            ? "present"
            : "absent",
        }));

        if (existingDay) {
          return {
            ...sem,
            attendanceData: sem.attendanceData.map((day) =>
              day.date === targetDate
                ? {
                    ...day,
                    dayType: null,
                    lectures,
                  }
                : day
            ),
          };
        }

        return {
          ...sem,
          attendanceData: [
            ...sem.attendanceData,
            {
              date: targetDate,
              dayType: null,
              lectures,
            },
          ],
        };
      })
    );
  }

  function markDayLectureStatuses(date, statusMap = {}) {
    const targetDate = normalizeDateString(date);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        const existingDay = sem.attendanceData.find(
          (day) => day.date === targetDate
        );
        const baseLectures =
          existingDay?.lectures?.length
            ? existingDay.lectures
            : buildDayLectures(targetDate, currentSemesterId, null);

        const lectures = baseLectures.map((lecture) => {
          const nextStatus = statusMap[lecture.subjectId];
          return {
            ...lecture,
            status: nextStatus ?? lecture.status ?? null,
          };
        });

        if (existingDay) {
          return {
            ...sem,
            attendanceData: sem.attendanceData.map((day) =>
              day.date === targetDate
                ? {
                    ...day,
                    dayType: null,
                    lectures,
                  }
                : day
            ),
          };
        }

        return {
          ...sem,
          attendanceData: [
            ...sem.attendanceData,
            {
              date: targetDate,
              dayType: null,
              lectures,
            },
          ],
        };
      })
    );
  }

  function removeDayAttendance(date) {
    const targetDate = normalizeDateString(date);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        return {
          ...sem,
          attendanceData: sem.attendanceData.filter(
            (day) => day.date !== targetDate
          ),
        };
      })
    );
  }

  function addReminder(reminder) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        const reminders = Array.isArray(sem.reminders)
          ? sem.reminders
          : [];
        return {
          ...sem,
          reminders: [...reminders, reminder],
        };
      })
    );
  }

  function updateReminder(reminderId, updates) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        const reminders = Array.isArray(sem.reminders)
          ? sem.reminders
          : [];
        return {
          ...sem,
          reminders: reminders.map((item) =>
            item.id === reminderId ? { ...item, ...updates } : item
          ),
        };
      })
    );
  }

  function removeReminder(reminderId) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        const reminders = Array.isArray(sem.reminders)
          ? sem.reminders
          : [];
        return {
          ...sem,
          reminders: reminders.filter((item) => item.id !== reminderId),
        };
      })
    );
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
              ? {
                  ...day,
                  lectures: day.lectures.map((lec) => ({
                    ...lec,
                    status,
                  })),
                }
              : day
          ),
        };
      })
    );
  }

  /** NEW: markTodayAttendance for a single subject */
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
                    lec.subjectId === subjectId
                      ? { ...lec, status }
                      : lec
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
        markFullDayAttendance,
        markTodayAttendance,   // ✅ now provided
        setCurrentSemesterId,
        markDayStatus,
        markPartialDayAttendance,
        markDayLectureStatuses,
        removeDayAttendance,
        addReminder,
        updateReminder,
        removeReminder,
        addSemester,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  return useContext(SemesterContext);
}
