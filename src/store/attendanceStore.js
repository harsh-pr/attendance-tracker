// ---- DEFAULT SEMESTERS (INITIAL DATA ONLY) ----

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

export function upsertAttendanceForDate(
  semester,
  date,
  lectures
) {
  const index = semester.attendanceData.findIndex(
    (d) => d.date === date
  );

  if (index !== -1) {
    semester.attendanceData[index].lectures = lectures;
  } else {
    semester.attendanceData.push({
      date,
      lectures,
    });
  }
}


// Utility
export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}
