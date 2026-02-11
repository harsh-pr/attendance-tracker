/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_SEMESTERS,
  DEFAULT_SEMESTER_ID,
} from "../data/defaultSemesters";
import { getLecturesForDate } from "../utils/timetableUtils";
import { getTodayDate, ensureDayExists } from "../store/attendanceStore";

const SemesterContext = createContext();

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
        setSemesters(data.semesters?.length ? data.semesters : DEFAULT_SEMESTERS);
        setCurrentSemesterId(
          data.currentSemesterId || DEFAULT_SEMESTER_ID
        );
      } catch (error) {
        console.error("Failed to load attendance data.", error);
        setSemesters(DEFAULT_SEMESTERS);
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
    DEFAULT_SEMESTERS[0];

  /* ===== ENSURE DAY ENTRY FROM TIMETABLE ===== */
  function normalizeDateString(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return dateString;
    }
    return `${parsed.getFullYear()}-${parsed.getMonth() + 1}-${parsed.getDate()}`;
  }

  function markDayStatus(date, status) {
    const targetDate = normalizeDateString(date);
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        const schedule = getLecturesForDate(targetDate, currentSemesterId);
        let lectures = [];

        if (status === "holiday") {
          lectures = [];
        } else if (schedule.length) {
          lectures = schedule.map((lecture) => ({
            subjectId: lecture.subjectId,
            type: lecture.type,
            status,
          }));
        }

        const existingDay = sem.attendanceData.find(
          (day) => day.date === targetDate
        );

        if (existingDay) {
          return {
            ...sem,
            attendanceData: sem.attendanceData.map((day) =>
              day.date === targetDate ? { ...day, lectures } : day
            ),
          };
        }

        return {
          ...sem,
          attendanceData: [
            ...sem.attendanceData,
            { date: targetDate, lectures },
          ],
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
        addReminder,
        updateReminder,
        removeReminder,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  return useContext(SemesterContext);
}
