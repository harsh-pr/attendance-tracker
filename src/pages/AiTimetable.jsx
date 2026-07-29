import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSemester } from "../context/SemesterContext";
import { getCollegeTimetable, saveCollegeTimetable } from "../firebase/firestoreService";
import DynamicText from "../components/DynamicText";
import HoldButton from "../components/HoldButton";

// Default metadata for Semester 3
const DEFAULT_METADATA = {
  department: "INFORMATION TECHNOLOGY",
  classAdvisor: "Mr. Ankur Chavan",
  semester: "SEIT SEM-III Div-B",
  roomNo: "Room No. - 203",
};

// Default faculty database for Semester 3
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

// Default weekly timetable structure for Semester 3
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

// Generates blank metadata template
const makeBlankMetadata = (semName) => ({
  department: "INFORMATION TECHNOLOGY",
  classAdvisor: "",
  semester: semName || "New Semester",
  roomNo: "",
});

// Generates blank weekly grid structures
const makeBlankTimetable = () => ({
  monday: Array(7).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  tuesday: Array(7).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  wednesday: Array(7).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  thursday: Array(7).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  friday: Array(7).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
});

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

  // Helper to identify Semester 3
  const checkIsSemester3 = (sem) => {
    return sem?.name?.toLowerCase().includes("sem-iii") || 
           sem?.name?.toLowerCase().includes("semester 3") || 
           sem?.name?.toLowerCase().includes("sem 3") || 
           sem?.id === "sem3";
  };

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
        // Fallback checks
        if (checkIsSemester3(currentSemester)) {
          setMetadata(DEFAULT_METADATA);
          setFaculty(DEFAULT_FACULTY);
          setTimetable(DEFAULT_TIMETABLE);
        } else {
          // Initialize clean blank template for other semesters
          setMetadata(makeBlankMetadata(currentSemester?.name));
          setFaculty([]);
          setTimetable(makeBlankTimetable());
        }
      }
      setLoadingDb(false);
    }
    loadData();
  }, [currentSemesterId, currentSemester]);

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
      const isSem3 = checkIsSemester3(currentSemester);
      const newMeta = isSem3 ? DEFAULT_METADATA : makeBlankMetadata(currentSemester?.name);
      const newFac = isSem3 ? DEFAULT_FACULTY : [];
      const newTT = isSem3 ? DEFAULT_TIMETABLE : makeBlankTimetable();

      setMetadata(newMeta);
      setFaculty(newFac);
      setTimetable(newTT);
      saveToLocalStorage(newMeta, newFac, newTT);
      await saveCollegeTimetable(currentSemesterId, {
        metadata: newMeta,
        faculty: newFac,
        timetable: newTT
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

  const getCellClassName = (type, isLastCol = false, isLastRow = false) => {
    let base = "p-3.5 text-center transition-all duration-200 min-w-[110px] lg:min-w-0 align-middle ";
    if (!isLastCol) base += "border-r border-zinc-200 dark:border-zinc-800/80 ";
    if (!isLastRow) base += "border-b border-zinc-200 dark:border-zinc-800/80 ";

    if (isEditMode) base += "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 ";
    
    if (type === "free") return base + "bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600";
    if (type === "lab") return base + "bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-l-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold";
    if (type === "session") return base + "bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-l-amber-500 text-amber-900 dark:text-amber-200 font-bold";
    return base + "bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 font-bold";
  };

  const getSubjectStyle = (type) => {
    if (type === "lab") return "text-indigo-600 dark:text-indigo-400 font-extrabold text-[13px] tracking-tight";
    if (type === "session") return "text-amber-600 dark:text-amber-400 font-extrabold text-[13px] tracking-tight";
    return "text-zinc-900 dark:text-white font-extrabold text-[13px] tracking-tight";
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

  const renderCell = (dayKey, index, isLastCol = false, isLastRow = false) => {
    const schedule = timetable[dayKey] || [];
    const lec = schedule[index] || { subject: "", teacher: "", room: "", type: "free", colSpan: 1 };
    const colSpan = lec.colSpan || 1;

    return (
      <td
        key={index}
        colSpan={colSpan}
        className={getCellClassName(lec.type, isLastCol, isLastRow)}
        onClick={() => handleCellClick(dayKey, index)}
      >
        {lec.subject ? (
          <div className="space-y-1 select-none">
            {lec.room && (
              <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {lec.room}
              </div>
            )}
            <div className={getSubjectStyle(lec.type)}>
              {lec.subject}
              {lec.type === "lab" && <span className="text-[10px] font-bold opacity-85 block md:inline md:ml-1 text-indigo-500">(LAB)</span>}
            </div>
            {lec.teacher && (
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 truncate" title={getTeacherFullName(lec.teacher)}>
                {getTeacherFullName(lec.teacher).split(" & ")[0]} - {lec.teacher}
              </div>
            )}
          </div>
        ) : (
          <div className="text-zinc-300 dark:text-zinc-700 font-bold select-none">-</div>
        )}
      </td>
    );
  };

  const renderRow = (dayKey, dayIdx) => {
    const isWeekend = dayKey === "saturday" || dayKey === "sunday";
    const isLastRow = dayIdx === DAYS.length - 1;

    if (isWeekend) {
      return (
        <tr key={dayKey} className={`${!isLastRow ? "border-b border-zinc-200 dark:border-zinc-800/80" : ""} bg-zinc-50/50 dark:bg-zinc-950/40`}>
          <td className="p-4 font-black uppercase text-[10px] tracking-widest border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/80 w-[110px] text-zinc-500 dark:text-zinc-400">
            {dayKey.substring(0, 3)}
          </td>
          <td colSpan={9} className="p-5 text-center font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.25em] text-xs font-[Poppins]">
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
              className="bg-zinc-100/70 dark:bg-zinc-950 text-blue-600 dark:text-blue-400 font-black text-center align-middle border-r border-zinc-200 dark:border-zinc-800 leading-normal py-4"
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
              className="bg-zinc-100/70 dark:bg-zinc-950 text-blue-600 dark:text-blue-400 font-black text-center align-middle border-r border-zinc-200 dark:border-zinc-800 leading-normal py-4"
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

      const lec = schedule[i] || { colSpan: 1 };
      const span = lec.colSpan || 1;
      const isLastCol = (i + span - 1) >= 6;

      rowTds.push(renderCell(dayKey, i, isLastCol, isLastRow));

      if (span > 1) {
        skipCount = span - 1;
      }
    }

    return (
      <tr key={dayKey} className="hover:bg-zinc-100/40 dark:hover:bg-zinc-800/20 transition duration-150">
        <td className={`p-4 font-black uppercase text-[10px] tracking-widest border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/80 w-[110px] text-zinc-500 dark:text-zinc-400 ${!isLastRow ? "border-b border-zinc-200 dark:border-zinc-800/80" : ""}`}>
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
        <DynamicText
          items={[
            "Syncing College Timetable database...",
            "Fetching faculty records...",
            "Building weekly grid layout...",
          ]}
          interval={1800}
          className="text-xs font-semibold text-zinc-400"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-4 pt-6 pb-24 space-y-6 text-zinc-900 dark:text-zinc-100 font-sans"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            {metadata.department || "COLLEGE SCHEDULE"}
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 font-[Poppins] text-zinc-900 dark:text-white">
            🏫 {metadata.semester} Timetable
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {metadata.classAdvisor && <span>Advisor: <span className="font-bold text-zinc-800 dark:text-zinc-200">{metadata.classAdvisor}</span> | </span>}
            Room: <span className="font-bold text-zinc-800 dark:text-zinc-200">{metadata.roomNo || "Not set"}</span>
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 h-9 text-xs font-bold rounded-xl shadow-sm transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              isEditMode
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {isEditMode ? "💾 Save Layout" : "✏️ Edit Cells"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsMetadataModalOpen(true)}
            className="px-4 h-9 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            ⚙️ Edit Metadata
          </motion.button>

          <HoldButton
            onConfirm={resetToDefault}
            holdDuration={1500}
            variant="danger"
            icon="🔄"
            className="h-9 rounded-xl py-0"
          >
            Reset
          </HoldButton>
        </div>
      </div>

      {/* Morphic Tab Navigation */}
      <div className="relative flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl max-w-md border border-zinc-200 dark:border-zinc-700/60">
        <button
          onClick={() => setActiveTab("grid")}
          className={`relative flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
            activeTab === "grid" ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {activeTab === "grid" && (
            <motion.div
              layoutId="timetable-tab-pill"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
            />
          )}
          <span className="relative z-10">📊 Tabular Sheet</span>
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`relative flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
            activeTab === "list" ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {activeTab === "list" && (
            <motion.div
              layoutId="timetable-tab-pill"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
            />
          )}
          <span className="relative z-10">🕒 Today</span>
        </button>
        <button
          onClick={() => setActiveTab("faculty")}
          className={`relative flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
            activeTab === "faculty" ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {activeTab === "faculty" && (
            <motion.div
              layoutId="timetable-tab-pill"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
            />
          )}
          <span className="relative z-10">👥 Teachers</span>
        </button>
      </div>

      {/* TAB CONTENT: TABULAR GRID */}
      {activeTab === "grid" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl"
        >
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full min-w-[850px] lg:min-w-0 border-collapse text-left table-fixed">
              <thead>
                <tr className="bg-zinc-100/70 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 w-[110px]">
                    Day
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    9 AM - 10 AM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    10 AM - 11 AM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    11 AM - 11:20 AM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    11:20 AM - 12:20 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    12:20 PM - 1:20 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    1:20 PM - 2 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    2 PM - 3 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center">
                    3 PM - 4 PM
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
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
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-semibold text-center rounded-b-2xl border-t border-amber-500/20">
              💡 Click on any slot in the sheet grid to edit its content or change its duration.
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: TODAY'S TIMELINE */}
      {activeTab === "list" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
              Today's Schedule ({todayData.dayName.toUpperCase()})
            </h3>
          </div>

          {todayData.isWeekend ? (
            <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-10 rounded-3xl text-center space-y-2 backdrop-blur-xl shadow-xl">
              <p className="text-3xl">🎉</p>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Weekend Holiday</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No scheduled classes today. Enjoy your day!</p>
            </div>
          ) : todayData.lectures.length === 0 ? (
            <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-10 rounded-3xl text-center space-y-2 backdrop-blur-xl shadow-xl">
              <p className="text-3xl">📭</p>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No Lectures</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">There are no classes scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayData.lectures.map((lecture, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-transform hover:-translate-y-0.5 duration-200 backdrop-blur-xl shadow-md"
                >
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={getSubjectStyle(lecture.type)}>{lecture.subject}</span>
                      {lecture.type === "lab" && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-sans">
                          LAB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      👨‍🏫 Instructor: <span className="font-bold text-zinc-800 dark:text-zinc-200">{getTeacherFullName(lecture.teacher)} ({lecture.teacher})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 md:text-right w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-zinc-100 dark:border-zinc-800/80 pt-2 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] uppercase text-zinc-400 font-bold">Time</p>
                      <p className="text-zinc-800 dark:text-zinc-200 font-bold">{lecture.time}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[10px] uppercase text-zinc-400 font-bold">Location</p>
                      <p className="text-zinc-800 dark:text-zinc-200 font-bold">{lecture.room || metadata.roomNo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: TEACHERS */}
      {activeTab === "faculty" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 max-w-3xl mx-auto"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">Teachers Directory</h3>
            {isEditMode && (
              <button
                type="button"
                onClick={addFacultyMember}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition"
              >
                + Add Teacher
              </button>
            )}
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {faculty.map((f, idx) => (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition duration-150"
                >
                  <div className="flex-1 space-y-1 w-full text-left">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={f.subject}
                        onChange={(e) => handleFacultyChange(idx, "subject", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans"
                        placeholder="Subject name"
                      />
                    ) : (
                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white">{f.subject}</h4>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Code Abbrev: <span className="font-extrabold text-blue-600 dark:text-blue-400">{f.abbreviation}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2.5 text-left">
                      <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-black shrink-0">
                        {f.abbreviation}
                      </span>
                      <div className="font-sans">
                        {isEditMode ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={f.name}
                              onChange={(e) => handleFacultyChange(idx, "name", e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-semibold text-zinc-900 dark:text-white"
                              placeholder="Teacher name"
                            />
                            <input
                              type="text"
                              value={f.abbreviation}
                              onChange={(e) => handleFacultyChange(idx, "abbreviation", e.target.value)}
                              className="w-14 px-2 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold uppercase text-center text-zinc-900 dark:text-white"
                              placeholder="Code"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-extrabold text-zinc-900 dark:text-white">{f.name}</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Instructor</p>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => removeFacultyMember(idx)}
                        className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl font-bold cursor-pointer transition"
                      >
                        ✕ Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {faculty.length === 0 && (
                <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  No teachers added yet. Click "+ Add Teacher" to populate your directory.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* METADATA MODAL (SETTINGS) */}
      <AnimatePresence>
        {isMetadataModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-white text-left"
            >
              <h2 className="text-lg font-extrabold flex items-center gap-2">⚙️ Timetable Settings</h2>
              
              <div className="space-y-3 font-sans">
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Semester / Class Name
                  <input
                    type="text"
                    value={metadata.semester}
                    onChange={(e) => handleMetadataChange("semester", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Department
                  <input
                    type="text"
                    value={metadata.department}
                    onChange={(e) => handleMetadataChange("department", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Class Advisor
                  <input
                    type="text"
                    value={metadata.classAdvisor}
                    onChange={(e) => handleMetadataChange("classAdvisor", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Default Room No
                  <input
                    type="text"
                    value={metadata.roomNo}
                    onChange={(e) => handleMetadataChange("roomNo", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CELL EDIT POPUP */}
      <AnimatePresence>
        {editingCell && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-white text-left"
            >
              <h2 className="text-base font-bold flex items-center gap-2">
                ✏️ Edit Class slot ({editingCell.day.toUpperCase()}, slot {editingCell.index + 1})
              </h2>

              <div className="space-y-3 font-sans">
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Subject
                  <input
                    type="text"
                    value={cellSubject}
                    onChange={(e) => setCellSubject(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                    placeholder="e.g. POA, AT, DS&BAD"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Teacher Initials
                  <input
                    type="text"
                    value={cellTeacher}
                    onChange={(e) => setCellTeacher(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                    placeholder="e.g. AC, PM, SP"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Room No / Lab Location
                  <input
                    type="text"
                    value={cellRoom}
                    onChange={(e) => setCellRoom(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                    placeholder="e.g. Room No. - 203, Lab No. - 103"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Class Type
                  <select
                    value={cellType}
                    onChange={(e) => setCellType(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none text-zinc-900 dark:text-white"
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab / Practical</option>
                    <option value="session">Special Session (Mentor-Mentee)</option>
                    <option value="free">Free / Empty Slot</option>
                  </select>
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Duration
                  <select
                    value={cellColSpan}
                    onChange={(e) => setCellColSpan(parseInt(e.target.value, 10))}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none text-zinc-900 dark:text-white"
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
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
