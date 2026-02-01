import { WEEKLY_TIMETABLE } from "./timetable";

function ensureDayEntry(date) {
  setSemesters((prev) =>
    prev.map((sem) => {
      if (sem.id !== currentSemesterId) return sem;

      // already exists
      if (sem.attendanceData.some((d) => d.date === date))
        return sem;

      const weekday = getWeekday(date);
      const daySchedule = sem.timetable?.[weekday] || [];

      const lectures = daySchedule.map((item) => ({
        subjectId: item.subjectId,
        type: item.type,
        status: null, // not marked yet
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

export const DEFAULT_SEMESTERS = [
  {
    timetable: WEEKLY_TIMETABLE,
    id: "sem2",
    name: "Semester 2",
    subjects: [
      { id: "maths2", name: "Advanced Maths", type: "Theory" },
      { id: "electronics", name: "Electronics", type: "Theory" },
    ],
    attendanceData: [],
  },
];

