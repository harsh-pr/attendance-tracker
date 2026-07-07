import { useMemo, useState } from "react";
import Modal from "./Modal";
import { useSemester } from "../context/SemesterContext";
import { getLecturesForDate } from "../utils/timetableUtils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusConfig = {
  present: {
    label: "Present",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    tile:  "bg-emerald-50/80 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-500/30",
  },
  absent: {
    label: "Absent",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    tile:  "bg-rose-50/80 text-rose-950 dark:bg-rose-500/15 dark:text-rose-100 border border-rose-200 dark:border-rose-500/30",
  },
  free: {
    label: "Free",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    tile:  "bg-sky-50/80 text-sky-950 dark:bg-sky-500/15 dark:text-sky-100 border border-sky-200 dark:border-sky-500/30",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
    tile:  "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-350 border border-gray-250 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  holiday: {
    label: "Holiday",
    badge: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    tile:  "bg-sky-50/30 text-sky-700 dark:bg-sky-900/10 dark:text-sky-300 border border-sky-100 dark:border-sky-900/20",
  },
  exam: {
    label: "Exam Day",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    tile:  "bg-violet-50/80 text-violet-950 dark:bg-violet-500/15 dark:text-violet-100 border border-violet-200 dark:border-violet-500/30",
  },
  none: {
    label: "No Data",
    badge: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    tile:  "bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-800",
  },
  unscheduled: {
    label: "Not in Timetable",
    badge: "bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600",
    tile:  "bg-gray-50/10 dark:bg-gray-900/5 text-gray-300 dark:text-gray-600 border border-gray-100/50 dark:border-gray-850 opacity-35 select-none pointer-events-none",
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
      const loggedLecture     = dayEntry?.lectures?.find(l => l.subjectId === subject.id);
      const timetableLectures = getLecturesForDate(dateKey, currentSemester);
      const isScheduled       = timetableLectures.some(l => l.subjectId === subject.id);

      let statusKey = "unscheduled";

      if (dayEntry?.dayType === "holiday") {
        statusKey = "holiday";
      } else if (dayEntry?.dayType === "exam") {
        statusKey = "exam";
      } else if (loggedLecture) {
        statusKey = loggedLecture.status || "none";
      } else if (isScheduled) {
        statusKey = "none";
      } else if (isWeekend) {
        statusKey = "unscheduled";
      }

      return {
        dayNumber,
        status: statusKey,
        date,
        isWeekend
      };
    });
  }, [daysInMonth, year, monthIndex, attendanceData, subject.id, currentSemester]);

  const statusStyles = {
    Safe: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200 border border-green-200 dark:border-green-500/30",
    Risk: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200 border border-red-200 dark:border-red-500/30",
    "No Data": "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200 border border-gray-200 dark:border-gray-700",
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        {/* Header Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{subject.name}</h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyles[status]}`}>{status}</span>
            </div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{subject.type} Attendance History</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Attendance</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{attended} / {conducted} Lectures</p>
            </div>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Percentage</p>
              <p className={`text-lg font-black mt-0.5 ${percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{percentage}%</p>
            </div>
          </div>
        </div>

        {/* Calendar Nav */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">{monthLabel}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              aria-label="Previous month" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:shadow transition">←</button>
            <button type="button" onClick={() => setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              aria-label="Next month" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:shadow transition">→</button>
          </div>
        </div>

        {/* Grid Headers */}
        <div className="grid grid-cols-7 gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">
          {weekDays.map(day => <div key={day}>{day}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl border border-gray-150 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/20 p-2">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {leadingBlanks.map(blank => <div key={blank.key} className="h-10 sm:h-12 rounded-xl border border-transparent" />)}
            {calendarDays.map((day, index) => {
              const config = statusConfig[day.status];
              return (
                <div key={day.dayNumber}
                  className={`group flex flex-col justify-between h-10 sm:h-12 rounded-xl p-1 text-[11px] font-semibold transition ${config.tile}`}
                  style={{ animation: "fadeUp 0.3s ease-out", animationDelay: `${(index % 7) * 30}ms`, animationFillMode: "both" }}>
                  <div className="w-full flex items-center justify-between text-[10px]">
                    <span className="font-bold opacity-80">{day.dayNumber}</span>
                  </div>
                  <p className="w-full text-center text-[7px] font-extrabold uppercase tracking-wide truncate pb-0.5 select-none">{config.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-850 justify-center">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className={`w-3.5 h-3.5 rounded-md ${config.tile} flex items-center justify-center text-[6px]`} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
