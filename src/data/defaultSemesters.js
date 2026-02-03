export const DEFAULT_SEMESTERS = [
  {
    id: "sem2",
    name: "Semester 2",

    subjects: [
      { id: "python", name: "Python", type: "theory" },
      { id: "eg", name: "Engineering Graphics", type: "theory" },
      { id: "math", name: "Applied Mathematics", type: "theory" },
      { id: "ds", name: "Data Structures", type: "theory" },
      { id: "iks", name: "IKS", type: "theory" },
      { id: "phy", name: "Elective Physics", type: "theory" },
      { id: "chem", name: "Elective Chemistry", type: "theory" },
      { id: "ss", name: "SS & CS", type: "theory" },

      { id: "python_lab", name: "Python Lab", type: "lab" },
      { id: "ds_lab", name: "Data Structure Lab", type: "lab" },
      { id: "eg_lab", name: "EG/ACAD Lab", type: "lab" },
      { id: "phy_lab", name: "Physics Lab", type: "lab" },
      { id: "chem_lab", name: "Chemistry Lab", type: "lab" },
      { id: "math_tut", name: "Maths Tutorial", type: "lab" },
      { id: "iks_lab", name: "IKS Lab", type: "lab" },
      { id: "workshop", name: "Engineering Workshop", type: "lab" },
    ],
    attendanceData: [],
  },
];

export const DEFAULT_SEMESTER_ID = "sem2";