export function getDayKey(dateStr) {
  const day = new Date(dateStr).getDay();
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][day];
}

export function generateLecturesForDate(
  semester,
  date
) {
  const dayKey = getDayKey(date);
  const timetable = semester.timetable?.[dayKey];

  if (!timetable) return [];

  return timetable.map((slot) => ({
    subjectId: slot.subjectId,
    status: "absent", // default
  }));
}
