// src/store/attendanceStore.js
import { getLecturesForDate } from "../utils/timetableUtils";

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Ensures a date entry exists and returns it
 */
export function ensureDayExists(semester, date, semesterId) {
  let day = semester.attendanceData.find(d => d.date === date);

  if (!day) {
    const lecturesFromTT = getLecturesForDate(
      date,
      semesterId || semester.id
    );

    if (lecturesFromTT.length === 0) return null;

    day = {
      date,
      lectures: lecturesFromTT.map(l => ({
        subjectId: l.subjectId,
        status: null,
        type: l.type,      // theory / lab
      })),
    };

    semester.attendanceData.push(day);
  }

  return day;
}

/**
 * Mark attendance for a subject
 */
export function markTodayAttendance(
  semester,
  subjectId,
  status,
  dateOverride
) {
  const date = dateOverride || getTodayDate();
  const day = ensureDayExists(semester, date, semester.id);

  if (!day) return;

  const lecture = day.lectures.find(
    l => l.subjectId === subjectId
  );

  if (lecture) {
    lecture.status = status;
  }
}
