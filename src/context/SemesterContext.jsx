// src/context/SemesterContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_SEMESTERS,
  DEFAULT_SEMESTER_ID,
} from "../data/defaultSemesters";
import { getLecturesForDate } from "../utils/timetableUtils";
import { getTodayDate } from "../store/attendanceStore";

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
  function ensureDayEntry(date) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        // already exists
        if (sem.attendanceData.some((d) => d.date === date)) {
          return sem;
        }

        const daySchedule = getLecturesForDate(
          date,
          currentSemesterId
        );

        if (daySchedule.length === 0) return sem;

        const lectures = daySchedule.map((item) => ({
          subjectId: item.subjectId,
          type: item.type,
          status: null,
        }));

        return {
          ...sem,
          attendanceData: [
            ...sem.attendanceData,
            { date, lectures },
          ],
        };
      })
    );
  }

  /* ===== MARK ATTENDANCE ===== */
  function markTodayAttendance(subjectId, status, date) {
    const targetDate = date || getTodayDate();

    ensureDayEntry(targetDate);

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        return {
          ...sem,
          attendanceData: sem.attendanceData.map((day) => {
            if (day.date !== targetDate) return day;

            return {
              ...day,
              lectures: day.lectures.map((lec) =>
                lec.subjectId === subjectId
                  ? { ...lec, status }
                  : lec
              ),
            };
          }),
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
        setCurrentSemesterId,
        markTodayAttendance,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  return useContext(SemesterContext);
}
