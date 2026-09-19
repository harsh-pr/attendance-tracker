import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "./Modal";
import { useSemester } from "../context/SemesterContext";
import { getLecturesForDate } from "../utils/timetableUtils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusConfig = {
  present: {
    label: "Present",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-500/30",
    tile:  "bg-emerald-100/90 text-emerald-900 border-emerald-300/80 dark:bg-[#0c2a1e] dark:text-emerald-200 dark:border-emerald-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.12)]",
  },
  absent: {
    label: "Absent",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-300/80 dark:border-rose-500/30",
    tile:  "bg-rose-100/90 text-rose-900 border-rose-300/80 dark:bg-[#2c0e14] dark:text-rose-200 dark:border-rose-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(244,63,94,0.12)]",
  },
  free: {
    label: "Free",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200 border border-sky-300/80 dark:border-sky-500/30",
    tile:  "bg-sky-100/90 text-sky-900 border-sky-300/80 dark:bg-[#0c2333] dark:text-sky-200 dark:border-sky-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(14,165,233,0.12)]",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700",
    tile:  "bg-zinc-100/90 text-zinc-700 border-zinc-300 dark:bg-zinc-800/90 dark:text-zinc-300 dark:border-zinc-700 shadow-xs",
  },
  holiday: {
    label: "Holiday",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200 border border-sky-300/80 dark:border-sky-500/30",
    tile:  "bg-slate-100/70 text-slate-400 border-slate-200 border-dashed opacity-75 dark:bg-zinc-900/40 dark:text-zinc-500 dark:border-zinc-800/60 dark:border-dashed dark:opacity-50",
  },
  exam: {
    label: "Exam Day",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200 border border-purple-300/80 dark:border-purple-500/30",
    tile:  "bg-purple-100/90 text-purple-900 border-purple-300/80 dark:bg-[#221233] dark:text-purple-200 dark:border-purple-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(168,85,247,0.12)]",
  },
  none: {
    label: "No Data",
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
    tile:  "bg-white text-zinc-600 border-zinc-200/90 dark:bg-[#09090d] dark:text-zinc-400 dark:border-zinc-800/80",
  },
  unscheduled: {
    label: "Not in Timetable",
    badge: "bg-zinc-100/50 text-zinc-400 dark:bg-zinc-950/40 dark:text-zinc-600 border border-zinc-200/50 dark:border-zinc-800/40",
    tile:  "bg-zinc-50/30 text-zinc-300 border-zinc-200/40 dark:bg-zinc-950/30 dark:text-zinc-700 dark:border-zinc-800/40 border-dashed opacity-40 select-none pointer-events-none",
  }
};

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatDateKey(date) {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day   = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateString(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

const defaultSubjectData = {
  subject: { id: "", name: "", type: "theory" },
  attended: 0,
  conducted: 0,
  percentage: 0,
  status: "No Data",
};

export default function SubjectCalendarModal({ open, onClose, data }) {
  const { currentSemester } = useSemester();

  // Cache data so when closing, contents remain mounted during the exit animation
  const [cachedData, setCachedData] = useState(data);
  useEffect(() => {
    if (data) setCachedData(data);
  }, [data]);

  const activeData = data || cachedData || defaultSubjectData;
  const { subject, attended, conducted, percentage, status } = activeData;

  const attendanceData = useMemo(
    () => currentSemester?.attendanceData ?? [],
    [currentSemester?.attendanceData]
  );

  const initialMonthDate = useMemo(() => {
    if (!attendanceData.length) return new Date();
    return attendanceData.reduce((latest, entry) => {
      const parsed = parseDateString(entry.date);
      if (!parsed) return latest;
      return parsed > latest ? parsed : latest;
    }, new Date(0));
  }, [attendanceData]);

  const [activeMonthDate, setActiveMonthDate] = useState(
    new Date(initialMonthDate.getFullYear(), initialMonthDate.getMonth(), 1)
  );
  const [monthDirection, setMonthDirection] = useState(0);

  const handlePrevMonth = () => {
    setMonthDirection(-1);
    setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setMonthDirection(1);
    setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    if (open) {
      setMonthDirection(0);
      setActiveMonthDate(
        new Date(initialMonthDate.getFullYear(), initialMonthDate.getMonth(), 1)
      );
    }
  }, [open, initialMonthDate]);

  const monthLabel        = formatMonthLabel(activeMonthDate);
  const year              = activeMonthDate.getFullYear();
  const monthIndex        = activeMonthDate.getMonth();
  const daysInMonth       = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekdayIndex = new Date(year, monthIndex, 1).getDay();

  const leadingBlanks = Array.from({ length: startWeekdayIndex }, (_, i) => ({ key: `blank-${i}` }));

  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1;
      const date      = new Date(year, monthIndex, dayNumber);
      const dateKey   = formatDateKey(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      const dayEntry          = attendanceData.find(d => d.date === dateKey);
      const loggedLectures    = (dayEntry?.lectures || []).filter(l => l.subjectId === subject?.id);
      const timetableLectures = getLecturesForDate(dateKey, currentSemester);
      const effectiveLectures = (dayEntry?.lectures && dayEntry.lectures.length > 0)
        ? dayEntry.lectures
        : timetableLectures;
      const isScheduled       = effectiveLectures.some(l => l.subjectId === subject?.id);

      let statusKey = "unscheduled";

      if (loggedLectures.length > 0) {
        const statuses = loggedLectures.map(l => l.status).filter(Boolean);
        const hasPresent = statuses.some(s => s === "present" || s === "free");
        const hasAbsent  = statuses.some(s => s === "absent");
        if (hasPresent && !hasAbsent) statusKey = "present";
        else if (hasAbsent && !hasPresent) statusKey = "absent";
        else if (hasPresent && hasAbsent) statusKey = "present";
        else if (statuses.length > 0) statusKey = statuses[0];
        else statusKey = "none";
      } else if (dayEntry?.dayType === "holiday" || dayEntry?.dayType === "exam") {
        if (isWeekend) {
          statusKey = "holiday";
        } else if (isScheduled) {
          statusKey = dayEntry.dayType;
        } else {
          statusKey = "unscheduled";
        }
      } else if (isScheduled) {
        statusKey = "none";
      } else if (isWeekend) {
        statusKey = "holiday";
      }

      const todayKey = formatDateKey(new Date());
      const isToday  = formatDateKey(date) === todayKey;

      return {
        dayNumber,
        status: statusKey,
        date,
        isWeekend,
        isToday,
      };
    });
  }, [daysInMonth, year, monthIndex, attendanceData, subject?.id, currentSemester]);

  const statusStyles = {
    Safe: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30",
    Risk: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30",
    "No Data": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      noScroll={true}
      footer={
        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
          {Object.entries(statusConfig).map(([key, config]) => (
            <span
              key={key}
              className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${config.badge}`}
            >
              {config.label}
            </span>
          ))}
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        {/* Header Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">{subject.name}</h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyles[status]}`}>{status}</span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">{subject.type} Attendance History</p>
          </div>
          <div className="flex items-center gap-3 text-right shrink-0">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Attendance</p>
              <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100">{attended} / {conducted} Lectures</p>
            </div>
            <div className="border-l border-zinc-200 dark:border-zinc-800 pl-3">
              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Percentage</p>
              <p className={`text-base sm:text-lg font-black ${percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{percentage}%</p>
            </div>
          </div>
        </div>

        {/* Calendar Nav */}
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-[Poppins]">{monthLabel}</h3>
          <div className="flex items-center gap-4">
            <button type="button" onClick={handlePrevMonth}
              aria-label="Previous month" className="text-2xl leading-none text-zinc-600 transition hover:scale-110 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer">←</button>
            <button type="button" onClick={handleNextMonth}
              aria-label="Next month" className="text-2xl leading-none text-zinc-600 transition hover:scale-110 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer">→</button>
          </div>
        </div>

        {/* Grid Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center">
          {weekDays.map(day => <div key={day}>{day}</div>)}
        </div>

        {/* Calendar Grid with 60 FPS Directional Swipe Transition */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/80 p-2 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={monthDirection} initial={false}>
            <motion.div
              key={`${year}-${monthIndex}`}
              custom={monthDirection}
              variants={{
                enter: (dir) => ({
                  x: dir > 0 ? 50 : dir < 0 ? -50 : 0,
                  opacity: 0,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                },
                exit: (dir) => ({
                  x: dir > 0 ? -50 : dir < 0 ? 50 : 0,
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 380, damping: 30 },
                opacity: { duration: 0.15 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -40 || info.velocity.x < -300) {
                  handleNextMonth();
                } else if (info.offset.x > 40 || info.velocity.x > 300) {
                  handlePrevMonth();
                }
              }}
              className="grid grid-cols-7 gap-1 sm:gap-1.5 cursor-grab active:cursor-grabbing"
            >
              {leadingBlanks.map(blank => <div key={blank.key} className="h-10 sm:h-12 rounded-xl border border-transparent" />)}
              {calendarDays.map((day) => {
                const config = statusConfig[day.status];
                return (
                  <div key={day.dayNumber}
                    className={`group relative overflow-hidden flex flex-col justify-between min-h-[3.25rem] sm:min-h-[3.75rem] h-auto rounded-xl border p-1.5 text-[10px] sm:text-xs font-semibold transition ${config.tile} ${
                      day.isToday ? "ring-2 ring-blue-500 dark:ring-blue-400 !opacity-100 shadow-[0_0_14px_rgba(59,130,246,0.4)]" : ""
                    } hover:-translate-y-0.5 hover:shadow-md`}>
                    <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] opacity-75 font-semibold leading-none">
                      <span>{day.dayNumber}</span>
                    </div>
                    <p className="mt-1 w-full text-center text-[8px] sm:text-[9px] font-bold uppercase tracking-wider truncate pb-0.5 select-none">{config.label}</p>
                    {day.status === "holiday" && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-300 dark:stroke-zinc-800 opacity-60 dark:opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="0" x2="100" y2="100" strokeWidth="1.5" />
                        <line x1="100" y1="0" x2="0" y2="100" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status Legend Pills */}
        <div className="flex justify-end pt-1">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Object.entries(statusConfig).filter(([key]) => key !== "none" && key !== "unscheduled").map(([key, cfg]) => (
              <span key={key} className={`rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-bold ${cfg.badge}`}>
                {cfg.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
