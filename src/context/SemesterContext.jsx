// src/context/SemesterContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SEMESTERS } from "../data/defaultSemesters";
import { getLecturesForDate } from "../utils/timetableUtils";
import { getTodayDate } from "../store/attendanceStore";

const SemesterContext = createContext();

export function SemesterProvider({ children }) {
  const [semesters, setSemesters] = useState(() => {
    const saved = localStorage.getItem("semesters");
    return saved ? JSON.parse(saved) : DEFAULT_SEMESTERS;
  });

  const [currentSemesterId, setCurrentSemesterId] = useState(() => {
    return (
      localStorage.getItem("currentSemesterId") ||
      DEFAULT_SEMESTERS[0].id
    );
  });

  useEffect(() => {
    localStorage.setItem("semesters", JSON.stringify(semesters));
  }, [semesters]);

  useEffect(() => {
    localStorage.setItem(
      "currentSemesterId",
      currentSemesterId
    );
  }, [currentSemesterId]);

  const currentSemester = semesters.find(
    (s) => s.id === currentSemesterId
  );

  /* ===== ENSURE DAY ENTRY FROM TIMETABLE ===== */
  function ensureDayEntry(date) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        // already exists
        if (sem.attendanceData.some((d) => d.date === date)) {
          return sem;
        }

        const weekdayKey = getWeekdayKey(date);
        if (!weekdayKey) return sem;

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
