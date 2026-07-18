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
  
  const rawTimetable = semester?.rawTimetable || semester?.timetable;
  if (!rawTimetable) return [];

  let timetable = EMPTY_TIMETABLE;

  if (Array.isArray(rawTimetable)) {
    // Sort versions by startFrom ascending
    const sorted = [...rawTimetable].sort((a, b) => {
      const aDate = a.startFrom ? new Date(a.startFrom) : new Date(0);
      const bDate = b.startFrom ? new Date(b.startFrom) : new Date(0);
      return aDate - bDate;
    });

    let match = sorted[0]; // fallback to oldest
    for (const v of sorted) {
      if (v.startFrom && dateStr >= v.startFrom) {
        match = v;
      }
    }
    timetable = match?.timetable || EMPTY_TIMETABLE;
  } else {
    timetable = rawTimetable || EMPTY_TIMETABLE;
  }

  return timetable[dayKey] || [];
}