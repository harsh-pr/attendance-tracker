import { useMemo, useState } from "react";
import Modal from "./Modal";
import { useSemester } from "../context/SemesterContext";
import { getLecturesForDate } from "../utils/timetableUtils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusConfig = {
  present: {
    label: "Present",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    tile:  "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100",
  },
  absent: {
    label: "Absent",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    tile:  "bg-rose-50/80 text-rose-900 dark:bg-rose-500/15 dark:text-rose-100",
  },
  free: {
    label: "Free",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    tile:  "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    tile:  "bg-zinc-50/80 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100",
  },
  holiday: {
    label: "Holiday",
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    tile:  "bg-zinc-50/20 dark:bg-zinc-900/40 text-zinc-300 dark:text-zinc-600 border-dashed opacity-40",
  },
  exam: {
    label: "Exam Day",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
    tile:  "bg-purple-50/80 text-purple-900 dark:bg-purple-500/15 dark:text-purple-100",
  },
  none: {
    label: "No Data",
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    tile:  "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  },
  unscheduled: {
    label: "Not in Timetable",
    badge: "bg-zinc-100/50 text-zinc-400 dark:bg-zinc-950/40 dark:text-zinc-600",
    tile:  "bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-300 dark:text-zinc-700 border-dashed opacity-40 select-none pointer-events-none",
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

export default function SubjectCalendarModal({ open, onClose, data }) {
  const { currentSemester } = useSemester();
  const { subject, attended, conducted, percentage, status } = data;

  const attendanceData = useMemo(
    () => currentSemester.attendanceData ?? [],
    [currentSemester.attendanceData]
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
      const loggedLectures    = (dayEntry?.lectures || []).filter(l => l.subjectId === subject.id);
      const timetableLectures = getLecturesForDate(dateKey, currentSemester);
      const isScheduled       = timetableLectures.some(l => l.subjectId === subject.id);

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
  }, [daysInMonth, year, monthIndex, attendanceData, subject.id, currentSemester]);

  const statusStyles = {
    Safe: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30",
    Risk: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30",
    "No Data": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700",
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="flex flex-col gap-4">
        {/* Header Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{subject.name}</h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusStyles[status]}`}>{status}</span>
            </div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">{subject.type} Attendance History</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Attendance</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{attended} / {conducted} Lectures</p>
            </div>
            <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Percentage</p>
              <p className={`text-lg font-black mt-0.5 ${percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{percentage}%</p>
            </div>
          </div>
        </div>

        {/* Calendar Nav */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{monthLabel}</h3>
          </div>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              aria-label="Previous month" className="text-3xl leading-none text-zinc-600 transition hover:scale-110 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer">←</button>
            <button type="button" onClick={() => setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              aria-label="Next month" className="text-3xl leading-none text-zinc-600 transition hover:scale-110 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer">→</button>
          </div>
        </div>

        {/* Grid Headers */}
        <div className="grid grid-cols-7 gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center">
          {weekDays.map(day => <div key={day}>{day}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/80 p-2">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {leadingBlanks.map(blank => <div key={blank.key} className="h-12 sm:h-14 rounded-lg border border-transparent" />)}
            {calendarDays.map((day, index) => {
              const config = statusConfig[day.status];
              return (
                <div key={day.dayNumber}
                  title={day.isToday ? "Today" : undefined}
                  className={`group relative overflow-hidden flex flex-col justify-between min-h-[3.25rem] sm:min-h-[3.75rem] h-auto rounded-lg border p-1.5 text-[11px] sm:text-sm font-semibold transition ${
                    day.isToday
                      ? "!opacity-100 ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500/80 dark:border-blue-400/80 shadow-md shadow-blue-500/20 bg-blue-50/90 dark:bg-blue-950/35"
                      : `border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 ${config.tile}`
                  } hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:hover:border-zinc-700`}
                  style={{ animation: "fadeUp 0.5s ease-out", animationDelay: `${(index % 7) * 50}ms`, animationFillMode: "both" }}>
                  <div className="w-full flex items-center justify-between text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                    <div className="flex items-center gap-1">
                      <span className={day.isToday ? "flex h-5 min-w-5 items-center justify-center rounded-md bg-blue-600 px-1 text-[10px] font-black text-white shadow-xs shadow-blue-500/50" : ""}>
                        {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="hidden sm:inline-block rounded bg-blue-500/15 dark:bg-blue-400/20 px-1 py-0.2 text-[8px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-300 border border-blue-500/30">
                          Today
                        </span>
                      )}
                    </div>
                    {day.isToday ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-2 w-full text-center text-[8px] sm:text-[9px] font-bold uppercase tracking-wider truncate pb-0.5 select-none ${day.isToday ? "text-blue-700 dark:text-blue-300 font-black" : ""}`}>{config.label}</p>
                  {day.status === "holiday" && (
                    <svg className={`absolute inset-0 w-full h-full pointer-events-none stroke-zinc-300 dark:stroke-zinc-800 ${day.isToday ? "opacity-30 dark:opacity-20" : "opacity-60 dark:opacity-40"}`} viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100" y2="100" strokeWidth="1.5" />
                      <line x1="100" y1="0" x2="0" y2="100" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {Object.entries(statusConfig).map(([key, config]) => (
            <span key={key} className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${config.badge}`}>
              {config.label}
            </span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
