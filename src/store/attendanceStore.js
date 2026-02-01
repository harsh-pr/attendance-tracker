// ---- DEFAULT SEMESTERS (INITIAL DATA ONLY) ----

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export const semesters = [
  {
    id: "sem1",
    name: "Semester 1",
    subjects: [
      { id: "math", name: "Engineering Mathematics", type: "theory" },
      { id: "phy", name: "Applied Physics", type: "theory" },
      { id: "chem", name: "Elective Chemistry", type: "theory" },
      { id: "chem_lab", name: "Elective Chemistry (Lab)", type: "lab" },
    ],

    timetable: {
      monday: [
        { subjectId: "math" },
        { subjectId: "phy" },
        { subjectId: "chem" },
      ],
      tuesday: [
        { subjectId: "math" },
        { subjectId: "chem_lab" },
      ],
      wednesday: [
        { subjectId: "phy" },
        { subjectId: "chem" },
      ],
      thursday: [
        { subjectId: "math" },
        { subjectId: "phy" },
      ],
      friday: [
        { subjectId: "chem" },
        { subjectId: "chem_lab" },
      ],
    },

    attendanceData: [],
  },
];

import { getLecturesForDate } from "../utils/timetableUtils";

export function ensureDayExists(semester, date) {
  const exists = semester.attendanceData.find(
    (d) => d.date === date
  );

  if (exists) return exists;

  const lecturesFromTimetable = getLecturesForDate(date);

  const newDay = {
    date,
    lectures: lecturesFromTimetable.map((l) => ({
      subjectId: l.subjectId,
      status: null,
    })),
  };

  semester.attendanceData.push(newDay);
  return newDay;
}


export function markTodayAttendance(semester, subjectId, status) {
  const today = getTodayDate();
  const day = ensureDayExists(semester, today);

  const lecture = day.lectures.find(
    (l) => l.subjectId === subjectId
  );

  if (lecture) {
    lecture.status = status;
  }
}

