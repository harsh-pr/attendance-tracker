import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSemester } from "../context/SemesterContext";
import { getLecturesForDate } from "../utils/timetableUtils";

// ── INLINE SVG ICONS ──────────────────────────────────────────────────────────
const Icons = {
  Zap: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Calendar: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Check: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronLeft: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  ),
  RefreshCw: ({ className = "w-4 h-4 animate-spin" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

function formatDateString(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function QuickBackfillModal({ isOpen, onClose }) {
  const { currentSemester, batchSavePastAttendance } = useSemester();

  // Initialize default date range: 30 days ago to today
  const defaultDates = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      start: formatDateString(thirtyDaysAgo),
      end: formatDateString(today),
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [excludeWeekends, setExcludeWeekends] = useState(true);

  const [strategy, setStrategy] = useState("full_present"); // 'full_present' | 'rapid_logger'
  const [currentIndex, setCurrentIndex] = useState(0);

  // Map of custom day records for rapid logger: { [dateStr]: { dayMode: 'full'|'absent'|'partial', lectures: { [key]: 'present'|'absent'|'free' } } }
  const [rapidData, setRapidData] = useState({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generate list of date strings in range
  const dateList = useMemo(() => {
    if (!startDate || !endDate) return [];
    const list = [];
    let current = new Date(startDate);
    const stop = new Date(endDate);

    while (current <= stop) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!excludeWeekends || !isWeekend) {
        list.push(formatDateString(current));
      }
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, [startDate, endDate, excludeWeekends]);

  if (!isOpen) return null;

  const currentWorkingDate = dateList[currentIndex] || "";
  const currentLecturesFromTT = currentWorkingDate
    ? getLecturesForDate(currentWorkingDate, currentSemester)
    : [];

  const handleSetDayMode = (dateStr, mode) => {
    setRapidData((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        dayMode: mode,
      },
    }));
  };

  const handleSetLectureStatus = (dateStr, key, status) => {
    setRapidData((prev) => {
      const existing = prev[dateStr] || { dayMode: "partial", lectures: {} };
      return {
        ...prev,
        [dateStr]: {
          ...existing,
          dayMode: "partial",
          lectures: {
            ...existing.lectures,
            [key]: status,
          },
        },
      };
    });
  };

  const handleSaveBackfill = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = [];

      for (const dateStr of dateList) {
        const ttLectures = getLecturesForDate(dateStr, currentSemester);
        if (ttLectures.length === 0) continue;

        const dayRapid = rapidData[dateStr];
        let finalLectures = [];

        if (strategy === "full_present") {
          finalLectures = ttLectures.map((l) => ({
            subjectId: l.subjectId,
            type: l.type,
            slotIndex: l.slotIndex,
            status: "present",
          }));
        } else if (dayRapid) {
          if (dayRapid.dayMode === "full") {
            finalLectures = ttLectures.map((l) => ({
              subjectId: l.subjectId,
              type: l.type,
              slotIndex: l.slotIndex,
              status: "present",
            }));
          } else if (dayRapid.dayMode === "absent") {
            finalLectures = ttLectures.map((l) => ({
              subjectId: l.subjectId,
              type: l.type,
              slotIndex: l.slotIndex,
              status: "absent",
            }));
          } else {
            // Partial subject-by-subject
            finalLectures = ttLectures.map((l) => {
              const key = l.slotIndex != null ? `${l.subjectId}::${l.slotIndex}` : l.subjectId;
              const userStatus = dayRapid.lectures?.[key];
              return {
                subjectId: l.subjectId,
                type: l.type,
                slotIndex: l.slotIndex,
                status: userStatus || "present",
              };
            });
          }
        } else {
          // Default fallback for unvisited days in logger
          finalLectures = ttLectures.map((l) => ({
            subjectId: l.subjectId,
            type: l.type,
            slotIndex: l.slotIndex,
            status: "present",
          }));
        }

        recordsToSave.push({
          date: dateStr,
          dayType: null,
          lectures: finalLectures,
        });
      }

      batchSavePastAttendance(recordsToSave);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
      alert("Failed to save past attendance: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Icons.Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Backfill Past Days Attendance
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Quickly mark past weeks or months of attendance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Date Range Picker */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              1. Select Date Range
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentIndex(0);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentIndex(0);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={excludeWeekends}
                onChange={(e) => {
                  setExcludeWeekends(e.target.checked);
                  setCurrentIndex(0);
                }}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
              <span>Skip Weekends (Saturday & Sunday)</span>
            </label>
          </div>

          {/* 2. Strategy Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              2. Select Backfill Mode ({dateList.length} days selected)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStrategy("full_present")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  strategy === "full_present"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <div className="text-xs font-extrabold flex items-center gap-1.5">
                  <span>🟢 100% Present Start</span>
                </div>
                <div className="text-[10px] opacity-80 font-normal mt-0.5">
                  1-Click mark all {dateList.length} past days as 100% Attended.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStrategy("rapid_logger")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  strategy === "rapid_logger"
                    ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <div className="text-xs font-extrabold flex items-center gap-1.5">
                  <span>⚡ Rapid Day Logger</span>
                </div>
                <div className="text-[10px] opacity-80 font-normal mt-0.5">
                  Step day-by-day & toggle subject-wise partial attendance.
                </div>
              </button>
            </div>
          </div>

          {/* 3. Rapid Day-by-Day Partial Logger View */}
          {strategy === "rapid_logger" && dateList.length > 0 && (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              {/* Day Header + Step Controls */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Day {currentIndex + 1} of {dateList.length}
                  </span>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                    {new Date(currentWorkingDate).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 disabled:opacity-30 cursor-pointer"
                  >
                    <Icons.ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentIndex === dateList.length - 1}
                    onClick={() => setCurrentIndex((i) => Math.min(dateList.length - 1, i + 1))}
                    className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 disabled:opacity-30 cursor-pointer"
                  >
                    <Icons.ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Preset Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetDayMode(currentWorkingDate, "full")}
                  className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    (rapidData[currentWorkingDate]?.dayMode || "full") === "full"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  Full Present
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDayMode(currentWorkingDate, "absent")}
                  className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    rapidData[currentWorkingDate]?.dayMode === "absent"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30"
                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  Full Absent
                </button>
              </div>

              {/* Subject-Wise Lecture List for Partial Marking */}
              {currentLecturesFromTT.length > 0 ? (
                <div className="space-y-2 pt-1 border-t border-amber-500/20">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Subject-wise Lectures ({currentLecturesFromTT.length})
                  </span>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {currentLecturesFromTT.map((lec) => {
                      const key = lec.slotIndex != null ? `${lec.subjectId}::${lec.slotIndex}` : lec.subjectId;
                      const subObj = (currentSemester.subjects || []).find((s) => s.id === lec.subjectId);
                      const subName = subObj ? subObj.name : lec.subjectId;
                      const currentStatus = rapidData[currentWorkingDate]?.lectures?.[key] || "present";

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-xs"
                        >
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px] sm:max-w-[180px]">
                            {subName}
                          </span>

                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetLectureStatus(currentWorkingDate, key, "present")}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                currentStatus === "present"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                              }`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetLectureStatus(currentWorkingDate, key, "absent")}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                currentStatus === "absent"
                                  ? "bg-rose-500 text-white"
                                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                              }`}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetLectureStatus(currentWorkingDate, key, "free")}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                currentStatus === "free"
                                  ? "bg-sky-500 text-white"
                                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                              }`}
                            >
                              Free
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 font-medium text-center py-2 italic">
                  No lectures scheduled for this date.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <button
            onClick={handleSaveBackfill}
            disabled={isSaving || saveSuccess || dateList.length === 0}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                Syncing {dateList.length} Past Days...
              </>
            ) : saveSuccess ? (
              <>
                <Icons.Check className="w-4 h-4 text-white" />
                Backfilled {dateList.length} Days Successfully!
              </>
            ) : (
              <>
                <Icons.Zap className="w-4 h-4" />
                Save & Sync {dateList.length} Past Days
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
