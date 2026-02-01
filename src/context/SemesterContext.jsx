import { createContext, useContext, useEffect, useState } from "react";
import { semesters as DEFAULT_SEMESTERS } from "../store/attendanceStore";
import { WEEKLY_TIMETABLE } from "../data/timetable";
import { getTodayDate } from "../store/attendanceStore";

function getWeekday(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

const SemesterContext = createContext();

export function SemesterProvider({ children }) {
  const [semesters, setSemesters] = useState(() => {
    const saved = localStorage.getItem("semesters");
    return saved ? JSON.parse(saved) : DEFAULT_SEMESTERS;
  });

  const [currentSemesterId, setCurrentSemesterId] = useState(() => {
    return localStorage.getItem("currentSemesterId") || semesters[0].id;
  });

  useEffect(() => {
    localStorage.setItem("semesters", JSON.stringify(semesters));
  }, [semesters]);

  useEffect(() => {
    localStorage.setItem("currentSemesterId", currentSemesterId);
  }, [currentSemesterId]);

  const currentSemester = semesters.find(
    (s) => s.id === currentSemesterId
  );

  function ensureDayEntry(date) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;

        if (sem.attendanceData.some((d) => d.date === date))
          return sem;

        const weekday = getWeekday(date);
        const daySchedule = WEEKLY_TIMETABLE[weekday] || [];

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
