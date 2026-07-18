import { useState, useEffect } from "react";

const DEMO_TIMETABLE = {
  department: "INFORMATION TECHNOLOGY",
  classAdvisor: "Mr. Ankur Chavan",
  semester: "SEIT SEM-III Div-B",
  roomNo: "203",
  subjects: [
    {
      id: "ds_bad",
      name: "Data Structure & Basic Algorithms Design & Lab",
      abbreviation: "DS&BAD",
      teacher: "Mr. Ankur Chavan",
      teacherInitials: "AC"
    },
    {
      id: "dbs",
      name: "Database Systems and Design & SQL Lab",
      abbreviation: "DBS",
      teacher: "Ms. Priyanka Manke",
      teacherInitials: "PM"
    },
    {
      id: "at",
      name: "Automata Theory",
      abbreviation: "AT",
      teacher: "Mr. Nilesh Mali",
      teacherInitials: "NM"
    },
    {
      id: "sds",
      name: "Statistics for Data Science",
      abbreviation: "SDS",
      teacher: "Ms. Tejaswini Nehe",
      teacherInitials: "TN"
    },
    {
      id: "poa",
      name: "Processor Organization & Architecture",
      abbreviation: "POA",
      teacher: "Dr. Sonali Pakhmode",
      teacherInitials: "SP"
    },
    {
      id: "python",
      name: "Modern Programming Practices using Python",
      abbreviation: "Python",
      teacher: "Ms. Mayuri Lohar / Mr. Kiran Deshmukh",
      teacherInitials: "ML/KD"
    },
    {
      id: "ed",
      name: "Entrepreneurship Development",
      abbreviation: "ED",
      teacher: "Dr. Neeraj Sharma",
      teacherInitials: "NS"
    },
    {
      id: "es",
      name: "Environmental Science",
      abbreviation: "ES",
      teacher: "APS",
      teacherInitials: "APS"
    },
    {
      id: "mini_proj",
      name: "Mini Project (Java)",
      abbreviation: "Mini Proj",
      teacher: "Mr. Ankur Chavan / Ms. Archana Khelurkar",
      teacherInitials: "AC/AK"
    }
  ],
  timetable: {
    monday: [
      { time: "09:00 to 10:00", subjectAbbr: "POA", teacherInitials: "SP", room: "R.N 203", type: "theory" },
      { time: "10:00 to 11:00", subjectAbbr: "AT", teacherInitials: "NM", room: "R.N 203", type: "theory" },
      { time: "11:20 to 12:20", subjectAbbr: "DS&BAD", teacherInitials: "AC", room: "R.N 203", type: "theory" },
      { time: "12:20 to 13:20", subjectAbbr: "DBS", teacherInitials: "PM", room: "R.N 203", type: "theory" },
      { time: "14:00 to 15:00", subjectAbbr: "ADSL(A) / SQL(B) / ED(C)", teacherInitials: "AC/PM/NS", room: "Lab 103/107/105", type: "lab" }
    ],
    tuesday: [
      { time: "09:00 to 10:00", subjectAbbr: "SDS", teacherInitials: "TN", room: "R.N 203", type: "theory" },
      { time: "10:00 to 11:00", subjectAbbr: "AT", teacherInitials: "NM", room: "R.N 203", type: "theory" },
      { time: "11:20 to 12:20", subjectAbbr: "DS&BAD", teacherInitials: "AC", room: "R.N 203", type: "theory" },
      { time: "12:20 to 13:20", subjectAbbr: "SDS", teacherInitials: "TN", room: "R.N 203", type: "theory" },
      { time: "14:00 to 15:00", subjectAbbr: "Python1(A) / ADSL(B) / Mini Proj(C)", teacherInitials: "ML/AC/AK", room: "Lab 102/103/112", type: "lab" },
      { time: "16:00 to 17:00", subjectAbbr: "MENTOR-MENTEE", teacherInitials: "AC", room: "R.N 203", type: "session" }
    ],
    wednesday: [
      { time: "09:00 to 10:00", subjectAbbr: "MENTOR-MENTEE", teacherInitials: "AC", room: "R.N 203", type: "session" },
      { time: "10:00 to 11:00", subjectAbbr: "POA", teacherInitials: "SP", room: "R.N 203", type: "theory" },
      { time: "11:20 to 12:20", subjectAbbr: "ED(A) / ES(B) / SQL(C)", teacherInitials: "NS/APS/PM", room: "Lab 112/102/107", type: "lab" },
      { time: "14:00 to 15:00", subjectAbbr: "Mini Proj(A) / Python1(B) / Python1(C)", teacherInitials: "AC/ML/AK", room: "Lab 101/107/103", type: "lab" }
    ],
    thursday: [
      { time: "09:00 to 10:00", subjectAbbr: "POA", teacherInitials: "SP", room: "R.N 203", type: "theory" },
      { time: "10:00 to 11:00", subjectAbbr: "AT", teacherInitials: "NM", room: "R.N 203", type: "theory" },
      { time: "11:20 to 12:20", subjectAbbr: "DS&BAD", teacherInitials: "AC", room: "R.N 203", type: "theory" },
      { time: "12:20 to 13:20", subjectAbbr: "DBS", teacherInitials: "PM", room: "R.N 203", type: "theory" },
      { time: "14:00 to 15:00", subjectAbbr: "ES(A) / Python2(B) / Python2(C)", teacherInitials: "APS/ML/AK", room: "Lab 101/107/103", type: "lab" }
    ],
    friday: [
      { time: "09:00 to 10:00", subjectAbbr: "SDS-TUT", teacherInitials: "TN", room: "R.N 203", type: "theory" },
      { time: "10:00 to 11:00", subjectAbbr: "DBS", teacherInitials: "PM", room: "R.N 203", type: "theory" },
      { time: "11:20 to 12:20", subjectAbbr: "SQL(A) / Mini Proj(B) / ES(C)", teacherInitials: "PM/NF/APS", room: "Lab 107/101/103", type: "lab" },
      { time: "14:00 to 15:00", subjectAbbr: "Python2(A) / ED(B) / ADSL(C)", teacherInitials: "ML/NS/AC", room: "Lab 112/101/105", type: "lab" }
    ]
  }
};

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export default function AiTimetable() {
  const [apiKey, setApiKey] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDayGrid, setSelectedDayGrid] = useState("monday");

  useEffect(() => {
    const savedKey = localStorage.getItem("GEMINI_API_KEY");
    if (savedKey) setApiKey(savedKey);

    const savedData = localStorage.getItem("PARSED_TIMETABLE_DATA");
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to restore saved timetable", e);
      }
    }
  }, []);

  const handleSaveKey = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem("GEMINI_API_KEY", val);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const loadDemoData = () => {
    setData(DEMO_TIMETABLE);
    localStorage.setItem("PARSED_TIMETABLE_DATA", JSON.stringify(DEMO_TIMETABLE));
  };

  const resetData = () => {
    setData(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    localStorage.removeItem("PARSED_TIMETABLE_DATA");
  };

  const scanTimetable = async () => {
    if (!selectedFile) {
      alert("Please select a timetable image first.");
      return;
    }
    if (!apiKey) {
      alert("Please provide a Gemini API Key to perform AI scanning.");
      return;
    }

    setLoading(true);
    setStatusText("Converting image to base64...");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Data = reader.result.split(",")[1];
        setStatusText("Scanning timetable with Gemini 2.5 Flash...");

        const prompt = `Analyze the uploaded college timetable image.
Extract the schedule details and subjects list.
Return the result strictly as a valid JSON object matching the following structure. Do not include markdown backticks or extra text, just raw JSON.

{
  "department": "e.g. INFORMATION TECHNOLOGY",
  "classAdvisor": "e.g. Mr. Ankur Chavan",
  "semester": "e.g. SEIT SEM-III Div-B",
  "roomNo": "e.g. 203",
  "subjects": [
    {
      "id": "unique_lower_id",
      "name": "Full Course Name",
      "abbreviation": "POA",
      "teacher": "Full Teacher Name",
      "teacherInitials": "SP"
    }
  ],
  "timetable": {
    "monday": [
      {
        "time": "9:00 to 10:00",
        "subjectAbbr": "POA",
        "teacherInitials": "SP",
        "room": "R.N 203",
        "type": "theory"
      }
    ],
    "tuesday": [...],
    "wednesday": [...],
    "thursday": [...],
    "friday": [...]
  }
}`;

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      { inlineData: { mimeType: selectedFile.type, data: base64Data } }
                    ]
                  }
                ]
              })
            }
          );

          if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
          }

          const resJson = await response.json();
          let rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          // Clean possible markdown JSON wrappers
          rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

          const parsedData = JSON.parse(rawText);
          setData(parsedData);
          localStorage.setItem("PARSED_TIMETABLE_DATA", JSON.stringify(parsedData));
        } catch (error) {
          console.error("AI scanning failed", error);
          alert("AI extraction failed. Please ensure the API key is correct and try again. Error: " + error.message);
        } finally {
          setLoading(false);
          setStatusText("");
        }
      };
    } catch (e) {
      console.error(e);
      alert("Error reading file");
      setLoading(false);
    }
  };

  // Get lectures for today dynamically
  const getTodayLectures = () => {
    if (!data?.timetable) return [];
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayIndex = new Date().getDay();
    const currentDay = dayNames[todayIndex];

    if (currentDay === "saturday" || currentDay === "sunday") {
      return { isWeekend: true, dayName: currentDay };
    }

    return {
      isWeekend: false,
      dayName: currentDay,
      lectures: data.timetable[currentDay] || []
    };
  };

  const todayData = getTodayLectures();

  const getSubjectColor = (type) => {
    if (type === "lab") return "border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20";
    if (type === "session") return "border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20";
    return "border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
  };

  const getSubjectBadge = (type) => {
    if (type === "lab") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300";
    if (type === "session") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  };

  const findTeacherName = (initials) => {
    if (!data?.subjects) return initials;
    // Handle combined labs e.g. AC/PM/NS
    const splitInitials = initials.split(/[\/\+]/).map(i => i.trim().replace(/^\//, ""));
    const matches = splitInitials.map(init => {
      const match = data.subjects.find(
        (s) => s.teacherInitials?.toLowerCase() === init.toLowerCase() || 
               s.teacherInitials?.toLowerCase() === `/${init.toLowerCase()}`
      );
      return match ? match.teacher : init;
    });
    return matches.join(" & ");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
          <span>✨ AI Timetable Scanner</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Scan image timetables to generate visual weekly agendas, teacher databases, and quick lecture lookups.
        </p>
      </div>

      {!data ? (
        /* SETUP / UPLOAD STATE */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Settings and Key Card */}
          <div className="md:col-span-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ⚙️ Setup Scanner
            </h2>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-550 uppercase tracking-wider">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={handleSaveKey}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Enter Gemini API Key..."
              />
              <p className="text-[10px] text-gray-500">
                Your key is stored locally in your browser. Get a free API Key from Google AI Studio.
              </p>
            </div>

            <div className="border-t border-gray-150 dark:border-gray-700 pt-4 space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Or try the scanner instantly using the pre-scanned timetable data:
              </p>
              <button
                type="button"
                onClick={loadDemoData}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-550 text-white rounded-xl text-xs font-bold shadow-md hover:scale-[0.98] transition cursor-pointer"
              >
                🚀 Load Demo Timetable
              </button>
            </div>
          </div>

          {/* Upload Card */}
          <div className="md:col-span-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center min-h-[300px] space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white w-full text-left">
              📸 Upload Timetable
            </h2>

            {previewUrl ? (
              <div className="relative w-full max-h-60 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-center">
                <img src={previewUrl} alt="Timetable preview" className="object-contain h-60" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-550 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 cursor-pointer hover:border-blue-500 transition-colors">
                <span className="text-3xl mb-2">📁</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Click to choose or drop image file
                </span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}

            <button
              type="button"
              onClick={scanTimetable}
              disabled={loading || !selectedFile}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-550 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{statusText}</span>
                </>
              ) : (
                <>
                  <span>✨ Scan Timetable with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* VISUALIZATION DASHBOARD */
        <div className="space-y-6 animate-fade-in">
          {/* Header Metadata Ribbon */}
          <div className="bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 backdrop-blur px-6 py-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {data.department || "INFORMATION TECHNOLOGY"}
              </h2>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                {data.semester || "Semester Schedule"} (Room {data.roomNo || "N/A"})
              </h3>
              {data.classAdvisor && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  👨‍🏫 Class Advisor: <span className="font-semibold text-gray-700 dark:text-gray-300">{data.classAdvisor}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={resetData}
              className="px-4 py-2 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Clear & Upload New
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-200/60 dark:bg-gray-800/60 p-1.5 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                activeTab === "today"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              ⚡ Today's Lectures
            </button>
            <button
              onClick={() => setActiveTab("timetable")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                activeTab === "timetable"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              📅 Weekly Schedule
            </button>
            <button
              onClick={() => setActiveTab("faculty")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                activeTab === "faculty"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              👥 Faculty Directory
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="min-h-[300px]">
            {activeTab === "today" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Agenda for Today ({todayData.dayName ? todayData.dayName.toUpperCase() : ""})
                  </h3>
                  <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold rounded-full border border-blue-100 dark:border-blue-900/30">
                    Realtime
                  </span>
                </div>

                {todayData.isWeekend ? (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 rounded-2xl text-center shadow-sm space-y-2">
                    <p className="text-4xl">🎉</p>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Weekend Mode Active</h4>
                    <p className="text-sm text-gray-500">No scheduled classes for today. Relax and recharge!</p>
                  </div>
                ) : todayData.lectures?.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 rounded-2xl text-center shadow-sm space-y-2">
                    <p className="text-4xl">📭</p>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">No Lectures Found</h4>
                    <p className="text-sm text-gray-500">There are no lectures listed for {todayData.dayName}.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todayData.lectures.map((lecture, i) => (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition ${getSubjectColor(
                          lecture.type
                        )}`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-450">
                              🕒 {lecture.time}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${getSubjectBadge(
                              lecture.type
                            )}`}>
                              {lecture.type || "theory"}
                            </span>
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            {lecture.subjectAbbr}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            🏢 Room: <span className="font-semibold text-gray-700 dark:text-gray-200">{lecture.room || data.roomNo || "N/A"}</span>
                          </p>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-700/60 mt-4 pt-3">
                          <p className="text-xs text-gray-650 dark:text-gray-300">
                            👨‍🏫 Teacher:{" "}
                            <span className="font-bold text-gray-900 dark:text-white">
                              {findTeacherName(lecture.teacherInitials)} ({lecture.teacherInitials})
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "timetable" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Day selector tabs */}
                <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0">
                  {WEEKDAYS.map((day) => {
                    const lectureCount = data.timetable[day]?.length || 0;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDayGrid(day)}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold text-sm w-full min-w-32 cursor-pointer transition ${
                          selectedDayGrid === day
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span className="capitalize">{day}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            selectedDayGrid === day
                              ? "bg-blue-700 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {lectureCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Day grid list */}
                <div className="lg:col-span-9 space-y-3">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                      {selectedDayGrid} Agenda Details
                    </h3>
                  </div>

                  {(!data.timetable[selectedDayGrid] || data.timetable[selectedDayGrid].length === 0) ? (
                    <div className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                      <p className="text-sm text-gray-500">No classes scheduled for this day.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.timetable[selectedDayGrid].map((lecture, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:translate-x-1 duration-200 transition ${getSubjectColor(
                            lecture.type
                          )}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-gray-900 dark:text-white">
                                {lecture.subjectAbbr}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${getSubjectBadge(
                                lecture.type
                              )}`}>
                                {lecture.type || "theory"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-550 dark:text-gray-400">
                              👨‍🏫 {findTeacherName(lecture.teacherInitials)} ({lecture.teacherInitials})
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 md:text-right w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 dark:border-gray-700 pt-2 md:pt-0">
                            <div>
                              <p className="text-[10px] uppercase text-gray-400">Time</p>
                              <p className="text-gray-750 dark:text-gray-300">{lecture.time}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-gray-400">Location</p>
                              <p className="text-gray-755 dark:text-gray-300">{lecture.room || data.roomNo || "Room 203"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "faculty" && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Faculty Database & Subjects Map
                  </h3>
                </div>

                <div className="divide-y divide-gray-150 dark:divide-gray-700">
                  {data.subjects?.map((sub, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {sub.name}
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span>Code Abbreviation:</span>
                          <span className="font-extrabold text-blue-600 dark:text-blue-400">
                            {sub.abbreviation}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 flex items-center justify-center text-xs font-black">
                          {sub.teacherInitials?.replace("/", "") || "??"}
                        </span>
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {sub.teacher || "TBD"}
                          </p>
                          <p className="text-[10px] text-gray-500">Instructor</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
