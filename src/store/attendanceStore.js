// src/store/attendanceStore.js
import { getLecturesForDate } from "../utils/timetableUtils";

export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Ensures a date entry exists and returns it
 */
export function ensureDayExists(semester, date) {
  let day = semester.attendanceData.find(d => d.date === date);

  if (!day) {
    const lecturesFromTT = getLecturesForDate(date, semester);

    if (lecturesFromTT.length === 0) return null;

    day = {
      date,
      dayType: null,
      lectures: lecturesFromTT.map((l, idx) => ({
        subjectId: l.subjectId,
        status: null,
        type: l.type,      // theory / lab
        slotIndex: l.slotIndex ?? idx,
      })),
    };

    semester.attendanceData.push(day);
  } else if (!day.lectures || day.lectures.length === 0) {
    const lecturesFromTT = getLecturesForDate(date, semester);
    day.lectures = lecturesFromTT.map((l, idx) => ({
      subjectId: l.subjectId,
      status: null,
      type: l.type,
      slotIndex: l.slotIndex ?? idx,
    }));
  }

  return day;
}

/**
 * Mark attendance for a subject at a specific slot
 */
export function markTodayAttendance(
  semester,
  subjectId,
  status,
  dateOverride,
  slotIndex
) {
  const date = dateOverride || getTodayDate();
  const day = ensureDayExists(semester, date);

  if (!day) return;

  // Clear holiday / exam flag when actively marking attendance
  day.dayType = null;

  // Use slotIndex for precise matching when available
  let lecture;
  if (slotIndex != null) {
    lecture = day.lectures.find(
      (l, idx) => l.subjectId === subjectId && (l.slotIndex ?? idx) === slotIndex
    );
  }
  // Fallback: match by subjectId only (backward compat for old data without slotIndex)
  if (!lecture) {
    lecture = day.lectures.find(
      l => l.subjectId === subjectId
    );
  }

  if (lecture) {
    lecture.status = status;
  } else {
    day.lectures.push({
      subjectId,
      status,
      type: "theory",
      slotIndex: slotIndex ?? day.lectures.length,
    });
  }
}

