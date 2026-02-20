import { SEMESTER_TIMETABLES } from "../data/timetable";
import { DEFAULT_SEMESTER_ID } from "../data/defaultSemesters";

const EMPTY_TIMETABLE = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

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

export function getLecturesForDate(dateStr, semesterInput, semesters = []) {
  const dayKey = getDayKeyFromDate(dateStr);
  if (!dayKey) return [];

  const semester =
    typeof semesterInput === "object"
      ? semesterInput
      : semesters.find((item) => item.id === semesterInput);
  const semesterId =
    typeof semesterInput === "string"
      ? semesterInput
      : semesterInput?.id;

  const timetable =
    semester?.timetable ||
    SEMESTER_TIMETABLES[semesterId || DEFAULT_SEMESTER_ID] ||
    EMPTY_TIMETABLE;

  return timetable[dayKey] || [];
}