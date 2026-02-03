import { SEMESTER_TIMETABLES } from "../data/timetable";
import { DEFAULT_SEMESTER_ID } from "../data/defaultSemesters";

export function getDayKeyFromDate(dateStr) {
  const day = new Date(dateStr).getDay();
  return {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
  }[day] || null;
}

export function getLecturesForDate(dateStr, semesterId) {
  const dayKey = getDayKeyFromDate(dateStr);
  if (!dayKey) return [];
  const timetable =
    SEMESTER_TIMETABLES[semesterId || DEFAULT_SEMESTER_ID] || {};
  return timetable[dayKey] || [];
}
