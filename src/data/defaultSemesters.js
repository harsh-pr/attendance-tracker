export const DEFAULT_SEMESTERS = [
  {
    id: "sem2",
    name: "Semester 2",

    subjects: [
      { id: "python", name: "Python", type: "theory" },
      { id: "eg", name: "Engineering Graphics", type: "theory" },
      { id: "iks", name: "IKS", type: "theory" },
      { id: "ss", name: "SS & CS", type: "theory" },

      { id: "python_lab", name: "Python Lab", type: "lab" },
      { id: "eg_lab", name: "EG/ACAD Lab", type: "lab" },
      { id: "iks_lab", name: "IKS Lab", type: "lab" },
      { id: "workshop", name: "Engineering Workshop", type: "lab" },
    ],
    attendanceData: [],
    reminders: [],
  },
];

export const DEFAULT_SEMESTER_ID = "sem2";