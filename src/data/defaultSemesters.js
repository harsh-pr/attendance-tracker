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

      { id: "python", name: "Python Lab", type: "lab" },
      { id: "ds", name: "DS Lab", type: "lab" },
      { id: "eg", name: "EG Lab", type: "lab" },
      { id: "phy", name: "Physics Lab", type: "lab" },
      { id: "chem", name: "Chemistry Lab", type: "lab" },
      { id: "math", name: "Maths Tutorial", type: "lab" },
      { id: "iks", name: "IKS Lab", type: "lab" },
      { id: "work", name: "Engineering Workshop", type: "lab" },
    ],

    attendanceData: [
      /* ===== 26 JAN — HOLIDAY ===== */
      {
        date: "2026-01-5",
        lectures: [
          { subjectId: "python", type: "theory", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "iks", type: "lab", status: "absent" },
          { subjectId: "ds", type: "theory", status: "absent" },
          { subjectId: "math", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-6",
        lectures: [
          { subjectId: "ds", type: "theory", status: "absent" },
          { subjectId: "phy", type: "lab", status: "absent" },
          { subjectId: "chem", type: "theory", status: "absent" },
          { subjectId: "python", type: "theory", status: "absent" },
          { subjectId: "iks", type: "theory", status: "absent" },
        ],
      },

      {
        date: "2026-01-7",
        lectures: [
          { subjectId: "chem", type: "theory", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "math", type: "theory", status: "absent" },
          { subjectId: "chem", type: "lab", status: "absent" },
          { subjectId: "ds", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-8",
        lectures: [
          { subjectId: "eg", type: "lab", status: "absent" },
          { subjectId: "phy", type: "theory", status: "absent" },
          { subjectId: "math", type: "theory", status: "absent" },
          { subjectId: "ss", type: "theory", status: "absent" },
        ],
      },

      {
        date: "2026-01-9",
        lectures: [
          { subjectId: "iks", type: "theory", status: "absent" },
          { subjectId: "phy", type: "theory", status: "absent" },
          { subjectId: "python", type: "lab", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "work", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-12",
        lectures: [
          { subjectId: "python", type: "theory", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "iks", type: "lab", status: "absent" },
          { subjectId: "ds", type: "theory", status: "absent" },
          { subjectId: "math", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-13",
        lectures: [
          { subjectId: "ds", type: "theory", status: "absent" },
          { subjectId: "phy", type: "lab", status: "absent" },
          { subjectId: "chem", type: "theory", status: "absent" },
          { subjectId: "python", type: "theory", status: "absent" },
          { subjectId: "iks", type: "theory", status: "absent" },
        ],
      },
      
      {
        date: "2026-01-16",
        lectures: [
          { subjectId: "iks", type: "theory", status: "absent" },
          { subjectId: "phy", type: "theory", status: "absent" },
          { subjectId: "python", type: "lab", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "work", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-19",
        lectures: [
          { subjectId: "python", type: "theory", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "iks", type: "lab", status: "absent" },
          { subjectId: "ds", type: "theory", status: "absent" },
          { subjectId: "math", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-20",
        lectures: [
          { subjectId: "ds", type: "theory", status: "absent" },
          { subjectId: "phy", type: "lab", status: "absent" },
          { subjectId: "chem", type: "theory", status: "absent" },
          { subjectId: "python", type: "theory", status: "absent" },
          { subjectId: "iks", type: "theory", status: "absent" },
        ],
      },

      {
        date: "2026-01-21",
        lectures: [
          { subjectId: "chem", type: "theory", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "math", type: "theory", status: "absent" },
          { subjectId: "chem", type: "lab", status: "absent" },
          { subjectId: "ds", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-22",
        lectures: [
          { subjectId: "eg", type: "lab", status: "absent" },
          { subjectId: "phy", type: "theory", status: "absent" },
          { subjectId: "math", type: "theory", status: "absent" },
          { subjectId: "ss", type: "theory", status: "absent" },
        ],
      },

      {
        date: "2026-01-23",
        lectures: [
          { subjectId: "iks", type: "theory", status: "absent" },
          { subjectId: "phy", type: "theory", status: "absent" },
          { subjectId: "python", type: "lab", status: "absent" },
          { subjectId: "eg", type: "theory", status: "absent" },
          { subjectId: "work", type: "lab", status: "absent" },
        ],
      },

      {
        date: "2026-01-26",
        lectures: [],
      },

      /* ===== 27 JAN ===== */
      {
        date: "2026-01-27",
        lectures: [
          { subjectId: "python", type: "theory", status: "present" },
          { subjectId: "eg", type: "theory", status: "present" },
          { subjectId: "iks", type: "theory", status: "absent" },
          { subjectId: "math", type: "theory", status: "present" },
          { subjectId: "ds", type: "theory", status: "present" },
        ],
      },

      /* ===== 28 JAN ===== */
      {
        date: "2026-01-28",
        lectures: [
          { subjectId: "chem", type: "theory", status: "present" },
          { subjectId: "eg", type: "theory", status: "present" },
          { subjectId: "math", type: "theory", status: "present" },
          { subjectId: "chem", type: "lab", status: "present" },
          { subjectId: "ds", type: "lab", status: "cancelled" }, // DS lab cancelled
        ],
      },

      /* ===== 29 JAN ===== */
      {
        date: "2026-01-29",
        lectures: [
          { subjectId: "phy", type: "theory", status: "present" },
          { subjectId: "math", type: "theory", status: "present" },
          { subjectId: "ds", type: "theory", status: "absent" }, // CS → DS assumed
          { subjectId: "iks", type: "theory", status: "absent" }, // SS assumed as IKS
        ],
      },

      /* ===== 30 JAN ===== */
      {
        date: "2026-01-30",
        lectures: [
          { subjectId: "iks", type: "theory", status: "present" },
          { subjectId: "phy", type: "theory", status: "present" },
          { subjectId: "python", type: "lab", status: "present" },
          { subjectId: "eg", type: "theory", status: "present" },
        ],
      },
    ],
  },
];

export const DEFAULT_SEMESTER_ID = "sem2";
