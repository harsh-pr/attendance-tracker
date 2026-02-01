import { WEEKLY_TIMETABLE } from "../data/timetable";

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

export function getLecturesForDate(dateStr) {
  const dayKey = getDayKeyFromDate(dateStr);
  if (!dayKey) return [];
  return WEEKLY_TIMETABLE[dayKey] || [];
}
