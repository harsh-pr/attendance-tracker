import { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSemester } from "../context/SemesterContext";
import { getCollegeTimetable, saveCollegeTimetable } from "../firebase/firestoreService";
import DynamicText from "../components/DynamicText";
import HoldButton from "../components/HoldButton";
import ShareTimetableModal from "../components/ShareTimetableModal";

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
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
  tuesday: [
    { subject: "SDS", teacher: "TN", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "AT", teacher: "NM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DS&BAD", teacher: "AC", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "SDS", teacher: "TN", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "Python1(A) / ADSL(B) / Mini Proj(C)", teacher: "ML/AC/AK", room: "Lab No. - 102/103/112", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
    { subject: "MENTOR-MENTEE SESSION", teacher: "AC", room: "Room No. - 203", type: "session", colSpan: 1 },
  ],
  wednesday: [
    { subject: "MENTOR-MENTEE SESSION", teacher: "AC", room: "Room No. - 203", type: "session", colSpan: 1 },
    { subject: "POA", teacher: "SP", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "ED(A) / ES(B) / SQL(C)", teacher: "NS/APS/PM", room: "Lab No. - 112/102/107", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
    { subject: "Mini Proj(A) / Python1(B) / Python1(C)", teacher: "AC/ML/AK", room: "Lab No. - 101/107/103", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
  thursday: [
    { subject: "POA", teacher: "SP", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "AT", teacher: "NM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DS&BAD", teacher: "AC", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DBS", teacher: "PM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "ES(A) / Python2(B) / Python2(C)", teacher: "APS/ML/AK", room: "Lab No. - 101/107/103", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
  friday: [
    { subject: "SDS-TUT", teacher: "TN", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "DBS", teacher: "PM", room: "Room No. - 203", type: "theory", colSpan: 1 },
    { subject: "SQL(A) / Mini Proj(B) / ES(C)", teacher: "PM/NF/APS", room: "Lab No. - 107/101/103", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
    { subject: "Python2(A) / ED(B) / ADSL(C)", teacher: "ML/NS/AC", room: "Lab No. - 112/101/105", type: "lab", colSpan: 2 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
    { subject: "", teacher: "", room: "", type: "free", colSpan: 1 },
  ],
  saturday: [],
  sunday: [],
};

// Default Time Slots
const DEFAULT_TIMESLOTS = [
  { id: "ts1", label: "9 AM - 10 AM", start: "09:00", end: "10:00" },
  { id: "ts2", label: "10 AM - 11 AM", start: "10:00", end: "11:00" },
  { id: "ts3", label: "11:20 AM - 12:20 PM", start: "11:20", end: "12:20" },
  { id: "ts4", label: "12:20 PM - 1:20 PM", start: "12:20", end: "13:20" },
  { id: "ts5", label: "2 PM - 3 PM", start: "14:00", end: "15:00" },
  { id: "ts6", label: "3 PM - 4 PM", start: "15:00", end: "16:00" },
  { id: "ts7", label: "4 PM - 5 PM", start: "16:00", end: "17:00" },
];

// Default Breaks
const DEFAULT_BREAKS = [
  { id: "br1", label: "recess", letters: ["B", "R", "E", "A", "K"], time: "11 AM - 11:20 AM", afterSlotIndex: 1 },
  { id: "br2", label: "lunch", letters: ["B", "R", "E", "A", "K"], time: "1:20 PM - 2 PM", afterSlotIndex: 3 },
];

// Default Active Days
const DEFAULT_ACTIVE_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const makeBlankMetadata = (semName) => ({
  department: "INFORMATION TECHNOLOGY",
  classAdvisor: "",
  semester: semName || "New Semester",
  roomNo: "",
});

const makeBlankTimetable = (slotCount = 7) => ({
  monday: Array(slotCount).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  tuesday: Array(slotCount).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  wednesday: Array(slotCount).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  thursday: Array(slotCount).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  friday: Array(slotCount).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  saturday: Array(slotCount).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
  sunday: Array(slotCount).fill(null).map(() => ({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 })),
});

export default function AiTimetable() {
  const { currentSemester, currentSemesterId } = useSemester();
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [faculty, setFaculty] = useState(DEFAULT_FACULTY);
  const [timetable, setTimetable] = useState(DEFAULT_TIMETABLE);
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIMESLOTS);
  const [breaks, setBreaks] = useState(DEFAULT_BREAKS);
  const [activeDays, setActiveDays] = useState(DEFAULT_ACTIVE_DAYS);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureTab, setStructureTab] = useState("hours"); // hours | breaks | days
  const [activeTab, setActiveTab] = useState("grid"); // grid | list | faculty
  const [loadingDb, setLoadingDb] = useState(true);

  // ── DRAFT states for modals (only committed on explicit Save) ──────────
  // Structure modal drafts
  const [draftTimeSlots, setDraftTimeSlots] = useState([]);
  const [draftBreaks, setDraftBreaks] = useState([]);
  const [draftActiveDays, setDraftActiveDays] = useState([]);

  // Options dropdown state & ref
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target)) {
        setIsOptionsMenuOpen(false);
      }
    }
    if (isOptionsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOptionsMenuOpen]);

  // Cell edit modal drafts
  const [cellSubject, setCellSubject] = useState("");
  const [cellTeacher, setCellTeacher] = useState("");
  const [cellRoom, setCellRoom] = useState("");
  const [cellType, setCellType] = useState("theory");
  const [cellColSpan, setCellColSpan] = useState(1);

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
        if (data.timeSlots && data.timeSlots.length > 0) setTimeSlots(data.timeSlots);
        if (data.breaks) setBreaks(data.breaks);
        if (data.activeDays && data.activeDays.length > 0) setActiveDays(data.activeDays);
      } else {
        if (checkIsSemester3(currentSemester)) {
          setMetadata(DEFAULT_METADATA);
          setFaculty(DEFAULT_FACULTY);
          setTimetable(DEFAULT_TIMETABLE);
          setTimeSlots(DEFAULT_TIMESLOTS);
          setBreaks(DEFAULT_BREAKS);
          setActiveDays(DEFAULT_ACTIVE_DAYS);
        } else {
          setMetadata(makeBlankMetadata(currentSemester?.name));
          setFaculty([]);
          setTimetable(makeBlankTimetable(DEFAULT_TIMESLOTS.length));
          setTimeSlots(DEFAULT_TIMESLOTS);
          setBreaks(DEFAULT_BREAKS);
          setActiveDays(DEFAULT_ACTIVE_DAYS);
        }
      }
      setLoadingDb(false);
    }
    loadData();
  }, [currentSemesterId, currentSemester]);

  const saveToLocalStorage = (newMeta, newFac, newTT, newSlots = timeSlots, newBreaks = breaks, newDays = activeDays) => {
    localStorage.setItem("TT_METADATA", JSON.stringify(newMeta));
    localStorage.setItem("TT_FACULTY", JSON.stringify(newFac));
    localStorage.setItem("TT_TIMETABLE", JSON.stringify(newTT));
    localStorage.setItem("TT_SLOTS", JSON.stringify(newSlots));
    localStorage.setItem("TT_BREAKS", JSON.stringify(newBreaks));
    localStorage.setItem("TT_DAYS", JSON.stringify(newDays));
  };

  // ── MODAL OPEN HANDLERS (snapshot current state into drafts) ────────────
  const openStructureModal = () => {
    setDraftTimeSlots(JSON.parse(JSON.stringify(timeSlots)));
    setDraftBreaks(JSON.parse(JSON.stringify(breaks)));
    setDraftActiveDays([...activeDays]);
    setStructureTab("hours");
    setIsStructureModalOpen(true);
  };

  const openMetadataModal = () => {
    setDraftMetadata({ ...metadata });
    setIsMetadataModalOpen(true);
  };

  const handleCellClick = (day, index) => {
    if (!isEditMode) return;
    const cell = (timetable[day] || [])[index] || { subject: "", teacher: "", room: "", type: "free", colSpan: 1 };
    setEditingCell({ day, index });
    setCellSubject(cell.subject || "");
    setCellTeacher(cell.teacher || "");
    setCellRoom(cell.room || "");
    setCellType(cell.type || "theory");
    setCellColSpan(cell.colSpan || 1);
  };

  // ── DISCARD (close without saving) ─────────────────────────────────────
  const discardStructureModal = () => {
    setIsStructureModalOpen(false);
    // Drafts are simply abandoned — real state is untouched
  };

  const discardMetadataModal = () => {
    setIsMetadataModalOpen(false);
  };

  const discardCellEdit = () => {
    setEditingCell(null);
  };

  // ── SAVE & COMMIT handlers ─────────────────────────────────────────────
  const saveCellEdit = async () => {
    if (!editingCell) return;
    const { day, index } = editingCell;
    const currentDaySchedule = [...(timetable[day] || [])];
    
    while (currentDaySchedule.length <= index) {
      currentDaySchedule.push({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 });
    }

    currentDaySchedule[index] = {
      subject: cellSubject.trim(),
      teacher: cellTeacher.trim(),
      room: cellRoom.trim(),
      type: cellType,
      colSpan: parseInt(cellColSpan, 10) || 1,
    };

    if (cellColSpan === 2 && index < currentDaySchedule.length - 1) {
      currentDaySchedule[index + 1] = {
        subject: "",
        teacher: "",
        room: "",
        type: "free",
        colSpan: 1
      };
    }

    const updatedTT = { ...timetable, [day]: currentDaySchedule };
    setTimetable(updatedTT);
    setEditingCell(null);

    saveToLocalStorage(metadata, faculty, updatedTT);
    await saveCollegeTimetable(currentSemesterId, {
      metadata, faculty, timetable: updatedTT, timeSlots, breaks, activeDays
    });
  };

  const saveMetadataModal = async () => {
    setMetadata(draftMetadata);
    setIsMetadataModalOpen(false);
    saveToLocalStorage(draftMetadata, faculty, timetable);
    await saveCollegeTimetable(currentSemesterId, {
      metadata: draftMetadata, faculty, timetable, timeSlots, breaks, activeDays
    });
  };

  const commitStructureChanges = async () => {
    // Commit drafts to real state
    setTimeSlots(draftTimeSlots);
    setBreaks(draftBreaks);
    setActiveDays(draftActiveDays);

    // Ensure timetable grid has enough slots
    const updatedTT = { ...timetable };
    ALL_DAYS.forEach((day) => {
      const arr = [...(updatedTT[day] || [])];
      while (arr.length < draftTimeSlots.length) {
        arr.push({ subject: "", teacher: "", room: "", type: "free", colSpan: 1 });
      }
      updatedTT[day] = arr;
    });

    setTimetable(updatedTT);
    setIsStructureModalOpen(false);

    saveToLocalStorage(metadata, faculty, updatedTT, draftTimeSlots, draftBreaks, draftActiveDays);
    await saveCollegeTimetable(currentSemesterId, {
      metadata, faculty, timetable: updatedTT,
      timeSlots: draftTimeSlots, breaks: draftBreaks, activeDays: draftActiveDays
    });
  };

  // ── DRAFT-ONLY mutators for Structure modal (no persistence) ───────────
  const handleAddTimeSlot = () => {
    const nextIdx = draftTimeSlots.length + 1;
    const newSlot = {
      id: `ts_${Date.now()}`,
      label: `${nextIdx + 8} AM - ${nextIdx + 9} AM`,
      start: `${nextIdx + 8}:00`,
      end: `${nextIdx + 9}:00`,
    };
    setDraftTimeSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveTimeSlot = (idx) => {
    if (draftTimeSlots.length <= 1) {
      alert("At least one time slot is required.");
      return;
    }
    setDraftTimeSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSlotChange = (idx, field, value) => {
    setDraftTimeSlots((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleAddBreak = () => {
    const newBreak = {
      id: `br_${Date.now()}`,
      label: "BREAK",
      letters: ["B", "R", "E", "A", "K"],
      time: "15 MIN BREAK",
      afterSlotIndex: 0,
    };
    setDraftBreaks((prev) => [...prev, newBreak]);
  };

  const handleRemoveBreak = (idx) => {
    setDraftBreaks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBreakChange = (idx, field, value) => {
    setDraftBreaks((prev) => prev.map((b, i) => {
      if (i !== idx) return b;
      if (field === "label") {
        return { ...b, label: value, letters: (value || "BREAK").toUpperCase().split("") };
      }
      return { ...b, [field]: value };
    }));
  };

  const handleToggleDay = (dayKey) => {
    setDraftActiveDays((prev) => {
      if (prev.includes(dayKey)) {
        if (prev.length <= 1) {
          alert("At least one working day is required.");
          return prev;
        }
        return prev.filter((d) => d !== dayKey);
      }
      return [...prev, dayKey];
    });
  };

  // ── DRAFT-ONLY mutator for Metadata modal ──────────────────────────────
  const handleDraftMetadataChange = (field, value) => {
    setDraftMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handleFacultyChange = async (index, field, value) => {
    const updatedFac = [...faculty];
    updatedFac[index] = { ...updatedFac[index], [field]: value };
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
    await saveCollegeTimetable(currentSemesterId, {
      metadata,
      faculty: updatedFac,
      timetable,
      timeSlots,
      breaks,
      activeDays
    });
  };

  const addFacultyMember = async () => {
    const updatedFac = [...faculty, { abbreviation: "NEW", name: "New Teacher", subject: "New Subject" }];
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
    await saveCollegeTimetable(currentSemesterId, {
      metadata,
      faculty: updatedFac,
      timetable,
      timeSlots,
      breaks,
      activeDays
    });
  };

  const removeFacultyMember = async (index) => {
    const updatedFac = faculty.filter((_, i) => i !== index);
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
    await saveCollegeTimetable(currentSemesterId, {
      metadata,
      faculty: updatedFac,
      timetable,
      timeSlots,
      breaks,
      activeDays
    });
  };

  const resetToDefault = async () => {
    if (window.confirm("Reset all modifications for this timetable back to defaults?")) {
      const isSem3 = checkIsSemester3(currentSemester);
      const newMeta = isSem3 ? DEFAULT_METADATA : makeBlankMetadata(currentSemester?.name);
      const newFac = isSem3 ? DEFAULT_FACULTY : [];
      const newTT = isSem3 ? DEFAULT_TIMETABLE : makeBlankTimetable(DEFAULT_TIMESLOTS.length);
      const newSlots = DEFAULT_TIMESLOTS;
      const newBreaks = DEFAULT_BREAKS;
      const newDays = DEFAULT_ACTIVE_DAYS;

      setMetadata(newMeta);
      setFaculty(newFac);
      setTimetable(newTT);
      setTimeSlots(newSlots);
      setBreaks(newBreaks);
      setActiveDays(newDays);

      saveToLocalStorage(newMeta, newFac, newTT, newSlots, newBreaks, newDays);
      await saveCollegeTimetable(currentSemesterId, {
        metadata: newMeta,
        faculty: newFac,
        timetable: newTT,
        timeSlots: newSlots,
        breaks: newBreaks,
        activeDays: newDays
      });
    }
  };

  // Get current day lectures for Today list view
  const getTodayLectures = () => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayIndex = new Date().getDay();
    const currentDay = dayNames[todayIndex];

    if (!activeDays.includes(currentDay)) {
      return { isWeekend: true, dayName: currentDay };
    }

    const rawLectures = timetable[currentDay] || [];
    const formatted = [];
    let skip = 0;
    
    timeSlots.forEach((slot, idx) => {
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
          const endIdx = idx + (lec.colSpan - 1);
          const endLabel = timeSlots[endIdx] ? timeSlots[endIdx].label.split(" - ")[1] || timeSlots[endIdx].label : slot.label;
          formatted.push({
            time: lec.colSpan > 1 ? `${slot.label.split(" - ")[0]} - ${endLabel}` : slot.label,
            ...lec
          });
        }
      }
    });

    return { isWeekend: false, dayName: currentDay, lectures: formatted };
  };

  const todayData = getTodayLectures();

  const getCellClassName = (type, isLastCol = false, isLastRow = false) => {
    let base = "p-3.5 text-center transition-all duration-200 min-w-[130px] align-middle ";
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

  const firstWorkingDayIndex = ALL_DAYS.findIndex((d) => activeDays.includes(d));

  const renderRow = (dayKey, dayIdx) => {
    const isWorking = activeDays.includes(dayKey);
    const isLastRow = dayIdx === ALL_DAYS.length - 1;
    const totalSlotCols = timeSlots.length + breaks.length;

    if (!isWorking) {
      return (
        <tr key={dayKey} className={`${!isLastRow ? "border-b border-zinc-200 dark:border-zinc-800/80" : ""} bg-zinc-50/50 dark:bg-zinc-950/40`}>
          <td className="p-4 font-black uppercase text-[10px] tracking-widest border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/80 w-[110px] text-zinc-500 dark:text-zinc-400">
            {dayKey.substring(0, 3)}
          </td>
          <td colSpan={totalSlotCols} className="p-5 text-center font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.25em] text-xs font-[Poppins]">
            HOLIDAY
          </td>
        </tr>
      );
    }

    const rowTds = [];
    let skipCount = 0;

    timeSlots.forEach((slot, i) => {
      const activeBreaks = breaks.filter((b) => b.afterSlotIndex === i);

      if (skipCount > 0) {
        skipCount--;
      } else {
        const lec = (timetable[dayKey] || [])[i] || { colSpan: 1 };
        const span = lec.colSpan || 1;
        const isLastCol = (i + span - 1) >= (timeSlots.length - 1) && activeBreaks.length === 0;

        rowTds.push(renderCell(dayKey, i, isLastCol, isLastRow));

        if (span > 1) {
          skipCount = span - 1;
        }
      }

      activeBreaks.forEach((b) => {
        if (dayIdx === firstWorkingDayIndex) {
          rowTds.push(
            <td
              key={`break-${b.id || b.label}-${i}`}
              rowSpan={activeDays.length}
              className="bg-zinc-100/70 dark:bg-zinc-950 text-blue-600 dark:text-blue-400 font-black text-center align-middle border-r border-zinc-200 dark:border-zinc-800 leading-normal py-4"
            >
              <div className="flex flex-col items-center justify-center font-[Poppins] gap-1.5 select-none text-[10px]">
                {(b.letters || (b.label || "BREAK").split("")).map((l, idx) => (
                  <span key={idx} className="font-black leading-none">{l}</span>
                ))}
              </div>
            </td>
          );
        }
      });
    });

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
            "Building custom weekly grid structure...",
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

        {/* Sleek Toolbar */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 h-9 text-xs font-bold rounded-xl shadow-sm transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              isEditMode
                ? "bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-500/30"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
            }`}
          >
            {isEditMode ? "💾 Done Editing" : "✏️ Edit Cells"}
          </motion.button>

          {/* Actions Options Dropdown */}
          <div ref={optionsMenuRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setIsOptionsMenuOpen((prev) => !prev)}
              className="px-3.5 h-9 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>⚙️ Actions</span>
              <span className={`text-[10px] text-zinc-400 transition-transform duration-200 ${isOptionsMenuOpen ? "rotate-180" : ""}`}>
                ▼
              </span>
            </motion.button>

            <AnimatePresence>
              {isOptionsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-56 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-2xl backdrop-blur-xl z-50 space-y-1 text-xs font-bold"
                >
                  <button
                    type="button"
                    onClick={() => {
                      openStructureModal();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                  >
                    <span>🛠️</span>
                    <span>Customize Hours & Days</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      openMetadataModal();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                  >
                    <span>⚙️</span>
                    <span>Edit Class & Advisor Details</span>
                  </button>

                  <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

                  <div className="p-0.5">
                    <HoldButton
                      onConfirm={() => {
                        resetToDefault();
                        setIsOptionsMenuOpen(false);
                      }}
                      holdDuration={1500}
                      variant="danger"
                      icon="🔄"
                      className="w-full text-xs rounded-xl py-1.5 justify-center"
                    >
                      Reset Timetable
                    </HoldButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-zinc-100/70 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 w-[110px]">
                    Day
                  </th>
                  {timeSlots.map((slot, i) => {
                    const activeBreaks = breaks.filter((b) => b.afterSlotIndex === i);
                    return (
                      <Fragment key={slot.id || i}>
                        <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center min-w-[130px]">
                          {slot.label}
                        </th>
                        {activeBreaks.map((b) => (
                          <th key={`hdr-br-${b.id || b.label}-${i}`} className="p-4 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 text-center bg-zinc-50 dark:bg-zinc-950/90 min-w-[60px]">
                            {b.time || b.label}
                          </th>
                        ))}
                      </Fragment>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ALL_DAYS.map((dayKey, dayIdx) => renderRow(dayKey, dayIdx))}
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

      {/* STRUCTURE & HOURS CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {isStructureModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-xl w-full rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-900 dark:text-white text-left max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h2 className="text-lg font-extrabold flex items-center gap-2">🛠️ Customize Hours, Days & Breaks</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Customize lecture timings, custom recess/lunch breaks, and active working days.</p>
                </div>
                <button
                  type="button"
                  onClick={discardStructureModal}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Sub Tabs */}
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setStructureTab("hours")}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    structureTab === "hours"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  🕒 Time Slots ({draftTimeSlots.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStructureTab("breaks")}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    structureTab === "breaks"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  ☕ Breaks ({draftBreaks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStructureTab("days")}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    structureTab === "days"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  📅 Days ({draftActiveDays.length})
                </button>
              </div>

              {/* TAB 1: HOURS / SLOTS */}
              {structureTab === "hours" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">Configure Lecture Hours</p>
                    <button
                      type="button"
                      onClick={handleAddTimeSlot}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-xs"
                    >
                      + Add Slot
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {draftTimeSlots.map((slot, idx) => (
                      <div
                        key={slot.id || idx}
                        className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-2"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={slot.label}
                          onChange={(e) => handleSlotChange(idx, "label", e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-zinc-900 dark:text-white focus:outline-none"
                          placeholder="e.g. 9 AM - 10 AM"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl font-bold text-xs cursor-pointer transition shrink-0"
                          title="Delete slot"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: BREAKS */}
              {structureTab === "breaks" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">Configure Recess & Lunch Breaks</p>
                    <button
                      type="button"
                      onClick={handleAddBreak}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-xs"
                    >
                      + Add Break
                    </button>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {draftBreaks.map((b, idx) => (
                      <div
                        key={b.id || idx}
                        className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={b.label}
                            onChange={(e) => handleBreakChange(idx, "label", e.target.value)}
                            className="px-3 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-extrabold text-zinc-900 dark:text-white uppercase focus:outline-none"
                            placeholder="Break Name (e.g. RECESS, LUNCH)"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBreak(idx)}
                            className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl font-bold cursor-pointer transition shrink-0"
                          >
                            ✕ Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">
                            Break Timing Label
                            <input
                              type="text"
                              value={b.time}
                              onChange={(e) => handleBreakChange(idx, "time", e.target.value)}
                              className="w-full mt-1 px-2.5 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-zinc-900 dark:text-white"
                              placeholder="e.g. 11 AM - 11:20 AM"
                            />
                          </label>

                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">
                            Appears After Slot
                            <select
                              value={b.afterSlotIndex}
                              onChange={(e) => handleBreakChange(idx, "afterSlotIndex", parseInt(e.target.value, 10))}
                              className="w-full mt-1 px-2.5 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-zinc-900 dark:text-white"
                            >
                              {draftTimeSlots.map((slot, sIdx) => (
                                <option key={slot.id || sIdx} value={sIdx}>
                                  Slot {sIdx + 1}: {slot.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                    {draftBreaks.length === 0 && (
                      <p className="text-xs text-zinc-400 py-4 text-center">No custom breaks added. Click "+ Add Break" to insert break columns.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DAYS */}
              {structureTab === "days" && (
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">Select Working Days</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_DAYS.map((dayKey) => {
                      const isActive = draftActiveDays.includes(dayKey);
                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => handleToggleDay(dayKey)}
                          className={`p-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between border cursor-pointer transition-all ${
                            isActive
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-xs"
                              : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
                          }`}
                        >
                          <span>{dayKey}</span>
                          <span className="text-sm">{isActive ? "✅" : "⚪"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={discardStructureModal}
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitStructureChanges}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  💾 Save Structure
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    value={draftMetadata.semester || ""}
                    onChange={(e) => handleDraftMetadataChange("semester", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Department
                  <input
                    type="text"
                    value={draftMetadata.department || ""}
                    onChange={(e) => handleDraftMetadataChange("department", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Class Advisor
                  <input
                    type="text"
                    value={draftMetadata.classAdvisor || ""}
                    onChange={(e) => handleDraftMetadataChange("classAdvisor", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </label>

                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Default Room No
                  <input
                    type="text"
                    value={draftMetadata.roomNo || ""}
                    onChange={(e) => handleDraftMetadataChange("roomNo", e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={discardMetadataModal}
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveMetadataModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  💾 Save Settings
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
                  onClick={discardCellEdit}
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

      <ShareTimetableModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </motion.div>
  );
}
