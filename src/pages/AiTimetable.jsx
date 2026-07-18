import { useState, useEffect } from "react";

// Default metadata
const DEFAULT_METADATA = {
  department: "INFORMATION TECHNOLOGY",
  classAdvisor: "Mr. Ankur Chavan",
  semester: "SEIT SEM-III Div-B",
  roomNo: "203 w.e.f 13/07/2026",
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
    { subject: "POA", teacher: "SP", room: "R.N 203", type: "theory" },
    { subject: "AT", teacher: "NM", room: "R.N 203", type: "theory" },
    { subject: "DS&BAD", teacher: "AC", room: "R.N.203", type: "theory" },
    { subject: "DBS", teacher: "PM", room: "R.N 203", type: "theory" },
    { subject: "ADSL(A) / SQL(B) / ED(C)", teacher: "AC/PM/NS", room: "Lab 103/107/105", type: "lab" },
    { subject: "", teacher: "", room: "", type: "free" },
    { subject: "", teacher: "", room: "", type: "free" },
  ],
  tuesday: [
    { subject: "SDS", teacher: "TN", room: "R.N 203", type: "theory" },
    { subject: "AT", teacher: "NM", room: "R.N 203", type: "theory" },
    { subject: "DS&BAD", teacher: "AC", room: "R.N.203", type: "theory" },
    { subject: "SDS", teacher: "TN", room: "R.N 203", type: "theory" },
    { subject: "Python1(A) / ADSL(B) / Mini Proj(C)", teacher: "ML/AC/AK", room: "Lab 102/103/112", type: "lab" },
    { subject: "", teacher: "", room: "", type: "free" },
    { subject: "MENTOR-MENTEE SESSION", teacher: "AC", room: "R.N 203", type: "session" },
  ],
  wednesday: [
    { subject: "MENTOR-MENTEE SESSION", teacher: "AC", room: "R.N 203", type: "session" },
    { subject: "POA", teacher: "SP", room: "R.N 203", type: "theory" },
    { subject: "ED(A) / ES(B) / SQL(C)", teacher: "NS/APS/PM", room: "Lab 112/102/107", type: "lab" },
    { subject: "", teacher: "", room: "", type: "free" },
    { subject: "Mini Proj(A) / Python1(B) / Python1(C)", teacher: "AC/ML/AK", room: "Lab 101/107/103", type: "lab" },
    { subject: "", teacher: "", room: "", type: "free" },
    { subject: "", teacher: "", room: "", type: "free" },
  ],
  thursday: [
    { subject: "POA", teacher: "SP", room: "R.N 203", type: "theory" },
    { subject: "AT", teacher: "NM", room: "R.N 203", type: "theory" },
    { subject: "DS&BAD", teacher: "AC", room: "R.N.203", type: "theory" },
    { subject: "DBS", teacher: "PM", room: "R.N 203", type: "theory" },
    { subject: "ES(A) / Python2(B) / Python2(C)", teacher: "APS/ML/AK", room: "Lab 101/107/103", type: "lab" },
    { subject: "", teacher: "", room: "", type: "free" },
    { subject: "", teacher: "", room: "", type: "free" },
  ],
  friday: [
    { subject: "SDS-TUT", teacher: "TN", room: "R.N 203", type: "theory" },
    { subject: "DBS", teacher: "PM", room: "R.N 203", type: "theory" },
    { subject: "SQL(A) / Mini Proj(B) / ES(C)", teacher: "PM/NF/APS", room: "Lab 107/101/103", type: "lab" },
    { subject: "", teacher: "", room: "", type: "free" },
    { subject: "Python2(A) / ED(B) / ADSL(C)", teacher: "ML/NS/AC", room: "Lab 112/101/105", type: "lab" },
    { subject: "", teacher: "", room: "", type: "free" },
    { subject: "", teacher: "", room: "", type: "free" },
  ],
};

const TIMESLOTS = [
  { label: "09:00 - 10:00", start: "09:00", end: "10:00" },
  { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
  { label: "11:20 - 12:20", start: "11:20", end: "12:20" },
  { label: "12:20 - 13:20", start: "12:20", end: "13:20" },
  { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
  { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
  { label: "16:00 - 17:00", start: "16:00", end: "17:00" },
];

const BREAKS = {
  recess: { label: "R E C E S S", letters: ["R", "E", "C", "E", "S", "S"], time: "11:00 - 11:20" },
  lunch: { label: "L U N C H", letters: ["L", "U", "N", "C", "H"], time: "13:20 - 14:00" },
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export default function AiTimetable() {
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [faculty, setFaculty] = useState(DEFAULT_FACULTY);
  const [timetable, setTimetable] = useState(DEFAULT_TIMETABLE);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("grid"); // grid | list | faculty

  // Form states for editing a slot
  const [cellSubject, setCellSubject] = useState("");
  const [cellTeacher, setCellTeacher] = useState("");
  const [cellRoom, setCellRoom] = useState("");
  const [cellType, setCellType] = useState("theory");

  // Load from localstorage if present
  useEffect(() => {
    const savedMeta = localStorage.getItem("TT_METADATA");
    const savedFac = localStorage.getItem("TT_FACULTY");
    const savedTT = localStorage.getItem("TT_TIMETABLE");

    if (savedMeta) setMetadata(JSON.parse(savedMeta));
    if (savedFac) setFaculty(JSON.parse(savedFac));
    if (savedTT) setTimetable(JSON.parse(savedTT));
  }, []);

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
  };

  const saveCellEdit = () => {
    if (!editingCell) return;
    const { day, index } = editingCell;
    const updatedDay = [...timetable[day]];
    updatedDay[index] = {
      subject: cellSubject.trim(),
      teacher: cellTeacher.trim(),
      room: cellRoom.trim(),
      type: cellType,
    };

    const updatedTT = {
      ...timetable,
      [day]: updatedDay,
    };

    setTimetable(updatedTT);
    saveToLocalStorage(metadata, faculty, updatedTT);
    setEditingCell(null);
  };

  const handleMetadataChange = (field, value) => {
    const updatedMeta = { ...metadata, [field]: value };
    setMetadata(updatedMeta);
    saveToLocalStorage(updatedMeta, faculty, timetable);
  };

  const handleFacultyChange = (index, field, value) => {
    const updatedFac = [...faculty];
    updatedFac[index] = { ...updatedFac[index], [field]: value };
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
  };

  const addFacultyMember = () => {
    const updatedFac = [...faculty, { abbreviation: "NEW", name: "New Teacher", subject: "New Subject" }];
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
  };

  const removeFacultyMember = (index) => {
    const updatedFac = faculty.filter((_, i) => i !== index);
    setFaculty(updatedFac);
    saveToLocalStorage(metadata, updatedFac, timetable);
  };

  const resetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all modifications back to default?")) {
      setMetadata(DEFAULT_METADATA);
      setFaculty(DEFAULT_FACULTY);
      setTimetable(DEFAULT_TIMETABLE);
      saveToLocalStorage(DEFAULT_METADATA, DEFAULT_FACULTY, DEFAULT_TIMETABLE);
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
    // Filter out break slots in timeline, mapping indices correctly
    const formatted = [];
    let listIdx = 0;
    
    TIMESLOTS.forEach((slot, idx) => {
      const lec = rawLectures[idx];
      if (lec && lec.subject) {
        formatted.push({
          time: slot.label,
          ...lec
        });
      }
    });

    return { isWeekend: false, dayName: currentDay, lectures: formatted };
  };

  const todayData = getTodayLectures();

  const getCellClassName = (type) => {
    let base = "p-3 text-center transition-all duration-200 border-b border-r border-gray-200 dark:border-gray-700 min-w-[120px] text-xs ";
    if (isEditMode) base += "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 ";
    
    if (type === "lab") return base + "bg-indigo-50/40 dark:bg-indigo-950/15 text-indigo-900 dark:text-indigo-200 font-medium";
    if (type === "session") return base + "bg-amber-50/40 dark:bg-amber-950/15 text-amber-900 dark:text-amber-200 font-medium";
    if (type === "free") return base + "bg-gray-50/50 dark:bg-gray-800/10 text-gray-400 dark:text-gray-650";
    return base + "bg-emerald-50/40 dark:bg-emerald-950/15 text-emerald-900 dark:text-emerald-200 font-semibold";
  };

  const getBadgeClassName = (type) => {
    if (type === "lab") return "text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold mt-1 inline-block";
    if (type === "session") return "text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold mt-1 inline-block";
    if (type === "free") return "text-[9px] uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-500 font-bold mt-1 inline-block";
    return "text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold mt-1 inline-block";
  };

  const findTeacherFullName = (abbr) => {
    const cleanAbbr = abbr.split("/").map(s => s.trim().replace(/^\//, ""));
    const names = cleanAbbr.map(init => {
      const match = faculty.find(f => f.abbreviation?.toLowerCase() === init.toLowerCase());
      return match ? match.name : init;
    });
    return names.join(" & ");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-24 space-y-8 animate-fade-in text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div className="space-y-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {metadata.department}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            📅 {metadata.semester} Timetable
          </h1>
          <p className="text-sm text-gray-550 dark:text-gray-400">
            Advisor: <span className="font-semibold text-gray-700 dark:text-gray-200">{metadata.classAdvisor}</span> | Room: <span className="font-semibold text-gray-700 dark:text-gray-200">{metadata.roomNo}</span>
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition duration-150 cursor-pointer ${
              isEditMode
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {isEditMode ? "💾 Stop Editing" : "✏️ Edit Timetable"}
          </button>
          <button
            type="button"
            onClick={() => setIsMetadataModalOpen(true)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            ⚙️ Settings
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="flex bg-gray-200/60 dark:bg-gray-800/60 p-1.5 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveTab("grid")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "grid"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-250"
          }`}
        >
          📊 Tabular Grid
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "list"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-250"
          }`}
        >
          ⚡ Today's Lectures
        </button>
        <button
          onClick={() => setActiveTab("faculty")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "faculty"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-250"
          }`}
        >
          👥 Faculty Directory
        </button>
      </div>

      {/* TAB CONTENT: TABULAR GRID */}
      {activeTab === "grid" && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden p-1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left table-fixed">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 w-[100px]">
                    Day
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[120px]">
                    09:00 - 10:00
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[120px]">
                    10:00 - 11:00
                  </th>
                  <th className="p-4 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[45px]">
                    Recess
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[120px]">
                    11:20 - 12:20
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[120px]">
                    12:20 - 13:20
                  </th>
                  <th className="p-4 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[45px]">
                    Lunch
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[120px]">
                    14:00 - 15:00
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 text-center w-[120px]">
                    15:00 - 16:00
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-[120px]">
                    16:00 - 17:00
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((dayKey, dayIdx) => {
                  const schedule = timetable[dayKey] || [];
                  return (
                    <tr
                      key={dayKey}
                      className="border-b border-gray-150 dark:border-gray-755 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition duration-150"
                    >
                      {/* Day Name Column */}
                      <td className="p-4 font-black uppercase text-xs tracking-wider border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                        {dayKey.substring(0, 3)}
                      </td>

                      {/* Slot 1 */}
                      <td className={getCellClassName(schedule[0]?.type)} onClick={() => handleCellClick(dayKey, 0)}>
                        <div className="font-bold">{schedule[0]?.subject || "-"}</div>
                        {schedule[0]?.teacher && <div className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">({schedule[0]?.teacher})</div>}
                        {schedule[0]?.room && <div className="text-[9px] text-gray-400 font-semibold">{schedule[0]?.room}</div>}
                        <span className={getBadgeClassName(schedule[0]?.type)}>{schedule[0]?.type}</span>
                      </td>

                      {/* Slot 2 */}
                      <td className={getCellClassName(schedule[1]?.type)} onClick={() => handleCellClick(dayKey, 1)}>
                        <div className="font-bold">{schedule[1]?.subject || "-"}</div>
                        {schedule[1]?.teacher && <div className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">({schedule[1]?.teacher})</div>}
                        {schedule[1]?.room && <div className="text-[9px] text-gray-400 font-semibold">{schedule[1]?.room}</div>}
                        <span className={getBadgeClassName(schedule[1]?.type)}>{schedule[1]?.type}</span>
                      </td>

                      {/* Recess Column Span */}
                      {dayIdx === 0 && (
                        <td
                          rowSpan={5}
                          className="bg-blue-50/30 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400 font-black text-center align-middle text-sm border-r border-gray-200 dark:border-gray-700 tracking-widest leading-loose py-4"
                        >
                          <div className="flex flex-col items-center justify-center font-[Poppins] gap-1.5 select-none">
                            {BREAKS.recess.letters.map((l, i) => (
                              <span key={i} className="text-xs font-bold leading-none">{l}</span>
                            ))}
                            <span className="text-[9px] font-medium text-gray-400 tracking-normal mt-2 rotate-90">{BREAKS.recess.time}</span>
                          </div>
                        </td>
                      )}

                      {/* Slot 3 */}
                      <td className={getCellClassName(schedule[2]?.type)} onClick={() => handleCellClick(dayKey, 2)}>
                        <div className="font-bold">{schedule[2]?.subject || "-"}</div>
                        {schedule[2]?.teacher && <div className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">({schedule[2]?.teacher})</div>}
                        {schedule[2]?.room && <div className="text-[9px] text-gray-400 font-semibold">{schedule[2]?.room}</div>}
                        <span className={getBadgeClassName(schedule[2]?.type)}>{schedule[2]?.type}</span>
                      </td>

                      {/* Slot 4 */}
                      <td className={getCellClassName(schedule[3]?.type)} onClick={() => handleCellClick(dayKey, 3)}>
                        <div className="font-bold">{schedule[3]?.subject || "-"}</div>
                        {schedule[3]?.teacher && <div className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">({schedule[3]?.teacher})</div>}
                        {schedule[3]?.room && <div className="text-[9px] text-gray-400 font-semibold">{schedule[3]?.room}</div>}
                        <span className={getBadgeClassName(schedule[3]?.type)}>{schedule[3]?.type}</span>
                      </td>

                      {/* Lunch Column Span */}
                      {dayIdx === 0 && (
                        <td
                          rowSpan={5}
                          className="bg-blue-50/30 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400 font-black text-center align-middle text-sm border-r border-gray-200 dark:border-gray-700 tracking-widest leading-loose py-4"
                        >
                          <div className="flex flex-col items-center justify-center font-[Poppins] gap-1.5 select-none">
                            {BREAKS.lunch.letters.map((l, i) => (
                              <span key={i} className="text-xs font-bold leading-none">{l}</span>
                            ))}
                            <span className="text-[9px] font-medium text-gray-400 tracking-normal mt-2 rotate-90">{BREAKS.lunch.time}</span>
                          </div>
                        </td>
                      )}

                      {/* Slot 5 */}
                      <td className={getCellClassName(schedule[4]?.type)} onClick={() => handleCellClick(dayKey, 4)}>
                        <div className="font-bold">{schedule[4]?.subject || "-"}</div>
                        {schedule[4]?.teacher && <div className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">({schedule[4]?.teacher})</div>}
                        {schedule[4]?.room && <div className="text-[9px] text-gray-400 font-semibold">{schedule[4]?.room}</div>}
                        <span className={getBadgeClassName(schedule[4]?.type)}>{schedule[4]?.type}</span>
                      </td>

                      {/* Slot 6 */}
                      <td className={getCellClassName(schedule[5]?.type)} onClick={() => handleCellClick(dayKey, 5)}>
                        <div className="font-bold">{schedule[5]?.subject || "-"}</div>
                        {schedule[5]?.teacher && <div className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">({schedule[5]?.teacher})</div>}
                        {schedule[5]?.room && <div className="text-[9px] text-gray-400 font-semibold">{schedule[5]?.room}</div>}
                        {schedule[5]?.subject && <span className={getBadgeClassName(schedule[5]?.type)}>{schedule[5]?.type}</span>}
                      </td>

                      {/* Slot 7 */}
                      <td className={getCellClassName(schedule[6]?.type)} onClick={() => handleCellClick(dayKey, 6)}>
                        <div className="font-bold">{schedule[6]?.subject || "-"}</div>
                        {schedule[6]?.teacher && <div className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">({schedule[6]?.teacher})</div>}
                        {schedule[6]?.room && <div className="text-[9px] text-gray-400 font-semibold">{schedule[6]?.room}</div>}
                        {schedule[6]?.subject && <span className={getBadgeClassName(schedule[6]?.type)}>{schedule[6]?.type}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isEditMode && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 text-xs font-semibold text-center rounded-b-2xl border-t border-yellow-100 dark:border-yellow-900/30">
              💡 Click on any class/lecture block in the table above to edit its content.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TODAY'S TIMELINE */}
      {activeTab === "list" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">
              Today's Schedule ({todayData.dayName.toUpperCase()})
            </h3>
            <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold rounded-full">
              Live Agenda
            </span>
          </div>

          {todayData.isWeekend ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-10 rounded-3xl text-center space-y-2">
              <p className="text-4xl">🎉</p>
              <h4 className="text-lg font-bold">Weekend Mode</h4>
              <p className="text-xs text-gray-500">No college lectures scheduled for today. Time to relax!</p>
            </div>
          ) : todayData.lectures.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-10 rounded-3xl text-center space-y-2">
              <p className="text-4xl">📭</p>
              <h4 className="text-lg font-bold">Free Day</h4>
              <p className="text-xs text-gray-500">There are no classes scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayData.lectures.map((lecture, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-transform hover:-translate-y-0.5 duration-200 ${
                    lecture.type === "lab"
                      ? "border-l-4 border-indigo-500"
                      : lecture.type === "session"
                      ? "border-l-4 border-amber-500"
                      : "border-l-4 border-emerald-500"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black">{lecture.subject}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                        lecture.type === "lab"
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-750"
                          : lecture.type === "session"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-750"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-750"
                      }`}>
                        {lecture.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-550 dark:text-gray-400">
                      👨‍🏫 Instructor: <span className="font-bold text-gray-700 dark:text-gray-200">{findTeacherFullName(lecture.teacher)} ({lecture.teacher})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 md:text-right w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-150 dark:border-gray-750 pt-2 md:pt-0">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Time</p>
                      <p className="text-gray-700 dark:text-gray-200">{lecture.time}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Location</p>
                      <p className="text-gray-700 dark:text-gray-200">{lecture.room || metadata.roomNo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FACULTY DIRECTORY */}
      {activeTab === "faculty" && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Faculty Members & Mapping</h3>
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

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-150 dark:divide-gray-755">
              {faculty.map((f, idx) => (
                <div
                  key={idx}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-750/30 transition duration-150"
                >
                  <div className="flex-1 space-y-1 w-full">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={f.subject}
                        onChange={(e) => handleFacultyChange(idx, "subject", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        placeholder="Subject name"
                      />
                    ) : (
                      <h4 className="font-bold text-sm">{f.subject}</h4>
                    )}
                    <p className="text-xs text-gray-500">
                      Code Abbrev: <span className="font-black text-blue-600 dark:text-blue-400">{f.abbreviation}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2 text-left">
                      <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 flex items-center justify-center text-xs font-black select-none">
                        {f.abbreviation}
                      </span>
                      <div>
                        {isEditMode ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={f.name}
                              onChange={(e) => handleFacultyChange(idx, "name", e.target.value)}
                              className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                              placeholder="Teacher name"
                            />
                            <input
                              type="text"
                              value={f.abbreviation}
                              onChange={(e) => handleFacultyChange(idx, "abbreviation", e.target.value)}
                              className="w-12 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold uppercase text-center"
                              placeholder="Code"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{f.name}</p>
                            <p className="text-[10px] text-gray-400">Instructor</p>
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
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <h2 className="text-lg font-bold flex items-center gap-2">⚙️ Timetable Settings</h2>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Semester / Class Name
                <input
                  type="text"
                  value={metadata.semester}
                  onChange={(e) => handleMetadataChange("semester", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Department
                <input
                  type="text"
                  value={metadata.department}
                  onChange={(e) => handleMetadataChange("department", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Class Advisor
                <input
                  type="text"
                  value={metadata.classAdvisor}
                  onChange={(e) => handleMetadataChange("classAdvisor", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Default Room No
                <input
                  type="text"
                  value={metadata.roomNo}
                  onChange={(e) => handleMetadataChange("roomNo", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
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
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <h2 className="text-lg font-bold flex items-center gap-2">
              ✏️ Edit Class slot ({editingCell.day.toUpperCase()}, slot {editingCell.index + 1})
            </h2>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Subject
                <input
                  type="text"
                  value={cellSubject}
                  onChange={(e) => setCellSubject(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
                  placeholder="e.g. POA, AT, DS&BAD"
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Teacher Initials
                <input
                  type="text"
                  value={cellTeacher}
                  onChange={(e) => setCellTeacher(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
                  placeholder="e.g. AC, PM, SP"
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Room No
                <input
                  type="text"
                  value={cellRoom}
                  onChange={(e) => setCellRoom(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
                  placeholder="e.g. R.N 203, Lab 103"
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Class Type
                <select
                  value={cellType}
                  onChange={(e) => setCellType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-705 bg-white dark:bg-gray-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white"
                >
                  <option value="theory">Theory</option>
                  <option value="lab">Lab / Practical</option>
                  <option value="session">Special Session (Mentor-Mentee)</option>
                  <option value="free">Free / Empty Slot</option>
                </select>
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl cursor-pointer"
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
