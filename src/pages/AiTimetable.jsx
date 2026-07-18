import { useState, useEffect } from "react";
import { useSemester } from "../context/SemesterContext";
import { getCollegeTimetable, saveCollegeTimetable } from "../firebase/firestoreService";

// Default metadata
const DEFAULT_METADATA = {
  department: "INFORMATION TECHNOLOGY",
  classAdvisor: "Mr. Ankur Chavan",
  semester: "SEIT SEM-III Div-B",
  roomNo: "Room No. - 203",
};

// Default faculty database
const DEFAULT_FACULTY = [
  { abbreviation: "AC", name: "Mr. Ankur Chavan", subject: "Data Structure & Basic Algorithms Design & Lab" },
  { abbreviation: "PM", name: "Ms. Priyanka Manke", subject: "Database Systems and Design & SQL Lab" },
  { abbreviation: "NM", name: "Mr. Nilesh Mali", subject: "Automata Theory" },
  { abbreviation: "TN", name: "Ms. Tejaswini Nehe", subject: "Statistics for Data Science" },
  { abbreviation: "SP", name: "Dr. Sonali Pakhmode", subject: "MDM-1: Processor Organization & Architecture" },
  { abbreviation: "ML", name: "Ms. Mayuri Lohar", subject: "Modern Programming Practices using Python" },
  { abbreviation: "KD", name: "Mr. Kiran Deshmukh", subject: "Modern Programming Practices using Python" },
  { abbreviation: "NS", name: "Dr. Neeraj Sharma", subject: "Entrepreneurship Development" },
  { abbreviation: "APS", name: "APS (Teacher)", subject: "Environmental Science" },
  { abbreviation: "AK", name: "Ms. Archana Khelurkar", subject: "Mini Project (Java)" },
];

// Default weekly timetable structure
const DEFAULT_TIMETABLE = {
  monday: [
    { subject: "POA", teacher: "SP", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "AT", teacher: "NM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DS&BAD", teacher: "AC", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DBS", teacher: "PM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "ADSL(A) / SQL(B) / ED(C)", teacher: "AC/PM/NS", room: "Lab No. - 103/107/105", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 }, // hidden placeholder
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
  tuesday: [
    { subject: "SDS", teacher: "TN", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "AT", teacher: "NM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DS&BAD", teacher: "AC", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "SDS", teacher: "TN", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "Python1(A) / ADSL(B) / Mini Proj(C)", teacher: "ML/AC/AK", room: "Lab No. - 102/103/112", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 }, // hidden placeholder
    { subject: "MENTOR-MENTEE SESSION", teacher: "AC", room: "Room No. - 203", type: "session", colSpan: 1 },
  ],
  wednesday: [
    { subject: "MENTOR-MENTEE SESSION", teacher: "AC", room: "Room No. - 203", type: "session", colSpan: 1 },
    { subject: "POA", teacher: "SP", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "ED(A) / ES(B) / SQL(C)", teacher: "NS/APS/PM", room: "Lab No. - 112/102/107", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 }, // hidden placeholder
    { subject: "Mini Proj(A) / Python1(B) / Python1(C)", teacher: "AC/ML/AK", room: "Lab No. - 101/107/103", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 }, // hidden placeholder
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
  thursday: [
    { subject: "POA", teacher: "SP", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "AT", teacher: "NM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DS&BAD", teacher: "AC", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DBS", teacher: "PM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "ES(A) / Python2(B) / Python2(C)", teacher: "APS/ML/AK", room: "Lab No. - 101/107/103", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 }, // hidden placeholder
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
  friday: [
    { subject: "SDS-TUT", teacher: "TN", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DBS", teacher: "PM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "SQL(A) / Mini Proj(B) / ES(C)", teacher: "PM/NF/APS", room: "Lab No. - 107/101/103", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 }, // hidden placeholder
    { subject: "Python2(A) / ED(B) / ADSL(C)", teacher: "ML/NS/AC", room: "Lab No. - 112/101/105", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 }, // hidden placeholder
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
};

const TIMESLOTS = [
  { label: "9 AM - 10 AM", start: "09:00", end: "10:00" },
  { label: "10 AM - 11 AM", start: "10:00", end: "11:00" },
  { label: "11:20 AM - 12:20 PM", start: "11:20", end: "12:20" },
  { label: "12:20 PM - 1:20 PM", start: "12:20", end: "13:20" },
  { label: "2 PM - 3 PM", start: "14:00", end: "15:00" },
  { label: "3 PM - 4 PM", start: "15:00", end: "16:00" },
  { label: "4 PM - 5 PM", start: "16:00", end: "17:00" },
];

const BREAKS = {
  recess: { label: "BREAK", letters: ["B", "R", "E", "A", "K"], time: "11 AM - 11:20 AM" },
  lunch: { label: "BREAK", letters: ["B", "R", "E", "A", "K"], time: "1:20 PM - 2 PM" },
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function AiTimetable() {
  const { currentSemester, currentSemesterId } = useSemester();
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [faculty, setFaculty] = useState(DEFAULT_FACULTY);
  const [timetable, setTimetable] = useState(DEFAULT_TIMETABLE);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("grid"); // grid | list | faculty
  const [loadingDb, setLoadingDb] = useState(true);

  // Form states for editing a slot
  const [cellSubject, setCellSubject] = useState("");
  const [cellTeacher, setCellTeacher] = useState("");
  const [cellRoom, setCellRoom] = useState("");
  const [cellType, setCellType] = useState("theory");
  const [cellColSpan, setCellColSpan] = useState(1);

  // Load from Firestore
  useEffect(() => {
    async function loadData() {
      if (!currentSemesterId) return;
      setLoadingDb(true);
      const data = await getCollegeTimetable(currentSemesterId);
      if (data) {
        if (data.metadata) setMetadata(data.metadata);
        if (data.faculty) setFaculty(data.faculty);
        if (data.timetable) setTimetable(data.timetable);
      } else {
        // Fall back to default template
        setMetadata(DEFAULT_METADATA);
        setFaculty(DEFAULT_FACULTY);
        setTimetable(DEFAULT_TIMETABLE);
      }
      setLoadingDb(false);
    }
    loadData();
  }, [currentSemesterId]);

  const saveToLocalStorage = (newMeta, newFac, newTT) => {
    localStorage.setItem("TT_METADATA", JSON.stringify(newMeta));
    localStorage.setItem("TT_FACULTY", JSON.stringify(newFac));
    localStorage.setItem("TT_TIMETABLE", JSON.stringify(newTT));
  };

  const handleCellClick = (day, index) => {
    if (!isEditMode) return;
    const cell = timetable[day][index];
    setEditingCell({ day, index });
    setCellSubject(cell.subject);
    setCellTeacher(cell.teacher);
    setCellRoom(cell.room);
    setCellType(cell.type || "theory");
    setCellColSpan(cell.colSpan || 1);
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;
    const { day, index } = editingCell;
    const updatedDay = [...timetable[day]];
    
    // Set cell details
    updatedDay[index] = {
      subject: cellSubject.trim(),
      teacher: cellTeacher.trim(),
      room: cellRoom.trim(),
      type: cellType,
      colSpan: parseInt(cellColSpan, 10) || 1,
    };

    // If colSpan is 2, make sure the next cell is marked as placeholder/free so it gets skipped
    if (cellColSpan === 2 && index < updatedDay.length - 1) {
      updatedDay[index + 1] = {
        subject: "",
        teacher: "",
        room: "",
        type: "free",
        colSpan: 1
      };
    }

    const updatedTT = {
      ...timetable,
      [day]: updatedDay,
    };

    setTimetable(updatedTT);
    setEditingCell(null);

    // Save to Firestore and localStorage
    saveToLocalStorage(metadata, faculty, updatedTT);
    await saveCollegeTimetable(currentSemesterId, { metadata, faculty, timetable: updatedTT });
  };

  const handleMetadataChange = async (field, value) => {
    const updatedMeta = { ...metadata, [field]: value };
    setMetadata(updatedMeta);
    saveToLocalStorage(updatedMeta, faculty, timetable);
    await saveCollegeTimetable(currentSemesterId, { metadata: updatedMeta, faculty, timetable });
  };

  const handleFacultyChange = async (index, field, value) => {
    const updatedFac = [...faculty];
    updatedFac[index] = { ...updatedFac[index], [field]: value };
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
    await saveCollegeTimetable(currentSemesterId, { metadata, faculty: updatedFac, timetable });
  };

  const addFacultyMember = async () => {
    const updatedFac = [...faculty, { abbreviation: "NEW", name: "New Teacher", subject: "New Subject" }];
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
    await saveCollegeTimetable(currentSemesterId, { metadata, faculty: updatedFac, timetable });
  };

  const removeFacultyMember = async (index) => {
    const updatedFac = faculty.filter((_, i) => i !== index);
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
    await saveCollegeTimetable(currentSemesterId, { metadata, faculty: updatedFac, timetable });
  };

  const resetToDefault = async () => {
    if (window.confirm("Are you sure you want to reset all modifications back to default?")) {
      setMetadata(DEFAULT_METADATA);
      setFaculty(DEFAULT_FACULTY);
      setTimetable(DEFAULT_TIMETABLE);
      saveToLocalStorage(DEFAULT_METADATA, DEFAULT_FACULTY, DEFAULT_TIMETABLE);
      await saveCollegeTimetable(currentSemesterId, {
        metadata: DEFAULT_METADATA,
        faculty: DEFAULT_FACULTY,
        timetable: DEFAULT_TIMETABLE
      });
    }
  };

  // Get current day lectures
  const getTodayLectures = () => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayIndex = new Date().getDay();
    const currentDay = dayNames[todayIndex];

    if (currentDay === "saturday" || currentDay === "sunday") {
      return { isWeekend: true, dayName: currentDay };
    }

    const rawLectures = timetable[currentDay] || [];
    const formatted = [];
    let skip = 0;
    
    TIMESLOTS.forEach((slot, idx) => {
      if (skip > 0) {
        skip--;
        return;
      }
      const lec = rawLectures[idx];
      if (lec) {
        if (lec.colSpan > 1) {
          skip = lec.colSpan - 1;
        }
        if (lec.subject) {
          formatted.push({
            time: lec.colSpan > 1 ? `${slot.label.split(" - ")[0]} - ${TIMESLOTS[idx + (lec.colSpan - 1)].label.split(" - ")[1]}` : slot.label,
            ...lec
          });
        }
      }
    });

    return { isWeekend: false, dayName: currentDay, lectures: formatted };
  };

  const todayData = getTodayLectures();

  const getCellClassName = (type) => {
    let base = "p-3.5 text-center transition-all duration-200 border-b border-r border-slate-200 dark:border-slate-800 min-w-[110px] lg:min-w-0 align-middle ";
    if (isEditMode) base += "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850/40 ";
    
    if (type === "free") return base + "bg-white dark:bg-[#0b0c10] text-slate-400 dark:text-slate-650";
    if (type === "lab") return base + "bg-[#fafbff] dark:bg-[#0e1017] border-l-2 border-indigo-400/40 dark:border-indigo-500/20";
    if (type === "session") return base + "bg-[#fffdf8] dark:bg-[#12110c] border-l-2 border-amber-400/40 dark:border-amber-500/20";
    return base + "bg-white dark:bg-[#0b0c10]";
  };

  const getSubjectStyle = (type) => {
    if (type === "lab") return "text-indigo-650 dark:text-indigo-400 font-extrabold text-[13px] tracking-tight";
    if (type === "session") return "text-amber-650 dark:text-amber-400 font-extrabold text-[13px] tracking-tight";
    return "text-yellow-600 dark:text-yellow-400 font-extrabold text-[13px] tracking-tight";
  };

  const getTeacherFullName = (abbr) => {
    if (!abbr) return "";
    const cleanAbbr = abbr.split("/").map(s => s.trim().replace(/^\//, ""));
    const names = cleanAbbr.map(init => {
      const match = faculty.find(f => f.abbreviation?.toLowerCase() === init.toLowerCase());
      return match ? match.name : init;
    });
    return names.join(" & ");
  };

  // Safe checks for Semester 3 availability
  const isSemester3 = currentSemester?.name?.toLowerCase().includes("sem-iii") || 
                       currentSemester?.name?.toLowerCase().includes("semester 3") || 
                       currentSemester?.name?.toLowerCase().includes("sem 3") || 
                       currentSemester?.id === "sem3";

  const renderCell = (dayKey, index) => {
    const schedule = timetable[dayKey] || [];
    const lec = schedule[index] || { subject: "", teacher: "", room: "", type: "free", colSpan: 1 };
    const colSpan = lec.colSpan || 1;

    return (
      <td
        key={index}
        colSpan={colSpan}
        className={getCellClassName(lec.type)}
        onClick={() => handleCellClick(dayKey, index)}
      >
        {lec.subject ? (
          <div className="space-y-1 select-none">
            {lec.room && (
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">
                {lec.room}
              </div>
            )}
            <div className={getSubjectStyle(lec.type)}>
              {lec.subject}
              {lec.type === "lab" && <span className="text-[10px] font-semibold opacity-85 block md:inline md:ml-1">(LAB)</span>}
            </div>
            {lec.teacher && (
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate" title={getTeacherFullName(lec.teacher)}>
                {getTeacherFullName(lec.teacher).split(" & ")[0]} - {lec.teacher}
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-350 dark:text-slate-700 font-semibold select-none">-</div>
        )}
      </td>
    );
  };

  const renderRow = (dayKey, dayIdx) => {
    const isWeekend = dayKey === "saturday" || dayKey === "sunday";
    if (isWeekend) {
      return (
        <tr key={dayKey} className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10">
          <td className="p-4 font-black uppercase text-[10px] tracking-widest border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30 w-[110px]">
            {dayKey.substring(0, 3)}
          </td>
          <td colSpan={9} className="p-5 text-center font-bold text-blue-650 dark:text-blue-450 uppercase tracking-[0.25em] text-xs font-[Poppins]">
            HOLIDAY
          </td>
        </tr>
      );
    }

    const schedule = timetable[dayKey] || [];
    const rowTds = [];
    let skipCount = 0;

    for (let i = 0; i < 7; i++) {
      // Recess Break Column Span
      if (i === 2) {
        if (dayIdx === 0) {
          rowTds.push(
            <td
              key="recess-break"
              rowSpan={5}
              className="bg-slate-100/50 dark:bg-[#161821] text-blue-600 dark:text-blue-455 font-black text-center align-middle border-r border-slate-250 dark:border-slate-800 leading-normal py-4"
            >
              <div className="flex flex-col items-center justify-center font-[Poppins] gap-1.5 select-none text-[10px]">
                {BREAKS.recess.letters.map((l, idx) => (
                  <span key={idx} className="font-black leading-none">{l}</span>
                ))}
              </div>
            </td>
          );
        }
      }

      // Lunch Break Column Span
      if (i === 4) {
        if (dayIdx === 0) {
          rowTds.push(
            <td
              key="lunch-break"
              rowSpan={5}
              className="bg-slate-100/50 dark:bg-[#161821] text-blue-600 dark:text-blue-455 font-black text-center align-middle border-r border-slate-250 dark:border-slate-800 leading-normal py-4"
            >
              <div className="flex flex-col items-center justify-center font-[Poppins] gap-1.5 select-none text-[10px]">
                {BREAKS.lunch.letters.map((l, idx) => (
                  <span key={idx} className="font-black leading-none">{l}</span>
                ))}
              </div>
            </td>
          );
        }
      }

      if (skipCount > 0) {
        skipCount--;
        continue;
      }

      rowTds.push(renderCell(dayKey, i));

      const lec = schedule[i] || { colSpan: 1 };
      if (lec.colSpan > 1) {
        skipCount = lec.colSpan - 1;
      }
    }

    return (
      <tr key={dayKey} className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition duration-150">
        <td className="p-4 font-black uppercase text-[10px] tracking-widest border-r border-slate-250 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30 w-[110px]">
          {dayKey.substring(0, 3)}
        </td>
        {rowTds}
      </tr>
    );
  };

  if (loadingDb) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-550">Syncing College Timetable database...</p>
      </div>
    );
  }

  if (!isSemester3) {
    return (
      <div className="max-w-2xl mx-auto p-12 mt-10 bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="text-5xl">🗓️</div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Class Timetable Restricted</h3>
        <p className="text-sm text-slate-550 dark:text-slate-400">
          This custom college timetable visualizer is exclusively configured for **Semester 3**.
          Please switch your active semester inside the Home page to Semester 3 to access this view.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-24 space-y-6 animate-fade-in text-gray-900 dark:text-slate-100 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md">
            {metadata.department}
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2">
            🏫 {metadata.semester} Timetable
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Advisor: <span className="font-semibold text-slate-700 dark:text-slate-200">{metadata.classAdvisor}</span> | Room: <span className="font-semibold text-slate-700 dark:text-slate-200">{metadata.roomNo}</span>
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 text-xs font-bold rounded-md shadow-sm transition duration-150 cursor-pointer ${
              isEditMode
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {isEditMode ? "💾 Save Layout" : "✏️ Edit Cells"}
          </button>
          <button
            type="button"
            onClick={() => setIsMetadataModalOpen(true)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-355 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-bold rounded-md transition cursor-pointer"
          >
            ⚙️ Edit Metadata
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white text-xs font-bold rounded-md transition cursor-pointer"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-md max-w-md border border-slate-250 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("grid")}
          className={`flex-1 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
            activeTab === "grid"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-750"
          }`}
        >
          📊 Tabular Sheet
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
            activeTab === "list"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-750"
          }`}
        >
          🕒 Today
        </button>
        <button
          onClick={() => setActiveTab("faculty")}
          className={`flex-1 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
            activeTab === "faculty"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-750"
          }`}
        >
          👥 Teachers
        </button>
      </div>

      {/* TAB CONTENT: TABULAR GRID */}
      {activeTab === "grid" && (
        <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-slate-800 rounded-none shadow-sm overflow-hidden p-1">
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full min-w-[850px] lg:min-w-0 border-collapse text-left table-fixed">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 w-[110px]">
                    Day
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    9 AM - 10 AM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    10 AM - 11 AM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    11 AM - 11:20 AM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    11:20 AM - 12:20 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    12:20 PM - 1:20 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    1:20 PM - 2 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    2 PM - 3 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 text-center">
                    3 PM - 4 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    4 PM - 5 PM
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((dayKey, dayIdx) => renderRow(dayKey, dayIdx))}
              </tbody>
            </table>
          </div>
          {isEditMode && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 text-xs font-semibold text-center rounded-b-2xl border-t border-amber-100 dark:border-amber-900/30">
              💡 Click on any slot in the sheet grid to edit its content or change its duration.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TODAY'S TIMELINE */}
      {activeTab === "list" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Today's Schedule ({todayData.dayName.toUpperCase()})
            </h3>
          </div>

          {todayData.isWeekend ? (
            <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-slate-800 p-10 rounded-3xl text-center space-y-2">
              <p className="text-3xl">🎉</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Weekend Holiday</h4>
              <p className="text-xs text-slate-500">No scheduled classes today. Enjoy your day!</p>
            </div>
          ) : todayData.lectures.length === 0 ? (
            <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-slate-800 p-10 rounded-3xl text-center space-y-2">
              <p className="text-3xl">📭</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Lectures</h4>
              <p className="text-xs text-slate-500">There are no classes scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayData.lectures.map((lecture, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-transform hover:-translate-y-0.5 duration-200"
                >
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={getSubjectStyle(lecture.type)}>{lecture.subject}</span>
                      {lecture.type === "lab" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          LAB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      👨‍🏫 Instructor: <span className="font-semibold text-slate-700 dark:text-slate-200">{getTeacherFullName(lecture.teacher)} ({lecture.teacher})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 md:text-right w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 pt-2 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Time</p>
                      <p className="text-slate-700 dark:text-slate-200">{lecture.time}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Location</p>
                      <p className="text-slate-700 dark:text-slate-200">{lecture.room || metadata.roomNo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TEACHERS */}
      {activeTab === "faculty" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-200">Teachers Database</h3>
            {isEditMode && (
              <button
                type="button"
                onClick={addFacultyMember}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                + Add Teacher
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {faculty.map((f, idx) => (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition duration-150"
                >
                  <div className="flex-1 space-y-1 w-full text-left">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={f.subject}
                        onChange={(e) => handleFacultyChange(idx, "subject", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        placeholder="Subject name"
                      />
                    ) : (
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{f.subject}</h4>
                    )}
                    <p className="text-xs text-slate-500">
                      Code Abbrev: <span className="font-extrabold text-blue-600 dark:text-blue-400">{f.abbreviation}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end font-sans">
                    <div className="flex items-center gap-2 text-left">
                      <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 flex items-center justify-center text-xs font-black">
                        {f.abbreviation}
                      </span>
                      <div>
                        {isEditMode ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={f.name}
                              onChange={(e) => handleFacultyChange(idx, "name", e.target.value)}
                              className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-gray-900 dark:text-white"
                              placeholder="Teacher name"
                            />
                            <input
                              type="text"
                              value={f.abbreviation}
                              onChange={(e) => handleFacultyChange(idx, "abbreviation", e.target.value)}
                              className="w-12 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase text-center text-gray-900 dark:text-white"
                              placeholder="Code"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{f.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Instructor</p>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => removeFacultyMember(idx)}
                        className="p-1 text-xs text-red-600 hover:text-red-500 font-semibold cursor-pointer"
                      >
                        ✕ Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* METADATA MODAL (SETTINGS) */}
      {isMetadataModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in text-gray-900 dark:text-white text-left">
            <h2 className="text-lg font-bold flex items-center gap-2">⚙️ Timetable Settings</h2>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Semester / Class Name
                <input
                  type="text"
                  value={metadata.semester}
                  onChange={(e) => handleMetadataChange("semester", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none text-gray-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Department
                <input
                  type="text"
                  value={metadata.department}
                  onChange={(e) => handleMetadataChange("department", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none text-gray-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Class Advisor
                <input
                  type="text"
                  value={metadata.classAdvisor}
                  onChange={(e) => handleMetadataChange("classAdvisor", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none text-gray-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Default Room No
                <input
                  type="text"
                  value={metadata.roomNo}
                  onChange={(e) => handleMetadataChange("roomNo", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none text-gray-900 dark:text-white"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMetadataModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CELL EDIT POPUP */}
      {editingCell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in text-gray-900 dark:text-white text-left">
            <h2 className="text-lg font-bold flex items-center gap-2">
              ✏️ Edit Class slot ({editingCell.day.toUpperCase()}, slot {editingCell.index + 1})
            </h2>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Subject
                <input
                  type="text"
                  value={cellSubject}
                  onChange={(e) => setCellSubject(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none text-gray-900 dark:text-white"
                  placeholder="e.g. POA, AT, DS&BAD"
                />
              </label>

              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Teacher Initials
                <input
                  type="text"
                  value={cellTeacher}
                  onChange={(e) => setCellTeacher(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none text-gray-900 dark:text-white"
                  placeholder="e.g. AC, PM, SP"
                />
              </label>

              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Room No
                <input
                  type="text"
                  value={cellRoom}
                  onChange={(e) => setCellRoom(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none text-gray-900 dark:text-white"
                  placeholder="e.g. Room No. - 203, Lab No. - 103"
                />
              </label>

              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Class Type
                <select
                  value={cellType}
                  onChange={(e) => setCellType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none text-gray-900 dark:text-white font-semibold"
                >
                  <option value="theory">Theory</option>
                  <option value="lab">Lab / Practical</option>
                  <option value="session">Special Session (Mentor-Mentee)</option>
                  <option value="free">Free / Empty Slot</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Duration
                <select
                  value={cellColSpan}
                  onChange={(e) => setCellColSpan(parseInt(e.target.value, 10))}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none text-gray-900 dark:text-white font-semibold"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours (Spans across next column)</option>
                </select>
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCellEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
