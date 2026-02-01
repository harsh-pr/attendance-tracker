// src/data/defaultSemesters.js

export const DEFAULT_SEMESTERS = [
  {
    id: "sem2",
    name: "Semester 2",
    subjects: [
      // THEORY
      { id: "python", name: "Python", type: "theory" },
      { id: "eg", name: "Engineering Graphics", type: "theory" },
      { id: "maths", name: "Applied Mathematics", type: "theory" },
      { id: "ds", name: "Data Structure", type: "theory" },
      { id: "iks", name: "IKS", type: "theory" },
      { id: "phy", name: "Elective Physics", type: "theory" },
      { id: "chem", name: "Elective Chemistry", type: "theory" },

      // LABS
      { id: "phy_lab", name: "Elective Physics Lab", type: "lab" },
      { id: "chem_lab", name: "Elective Chemistry Lab", type: "lab" },
      { id: "ds_lab", name: "Data Structure Lab", type: "lab" },
      { id: "eg_lab", name: "EG / ACAD Lab", type: "lab" },
      { id: "python_lab", name: "Python Lab", type: "lab" },
      { id: "maths_tut", name: "Applied Maths Tutorial", type: "lab" },
      { id: "iks_lab", name: "IKS Lab", type: "lab" },
    ],

    // IMPORTANT: start empty
    attendanceData: [],
  },
];

export const DEFAULT_SEMESTER_ID = "sem2";
