import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import Modal from "../components/Modal";
import NotificationPermissionModal from "../components/NotificationPermissionModal";
import QuickBackfillModal from "../components/QuickBackfillModal";
import DayLecturesEditor from "../components/DayLecturesEditor";
import { useNotificationPermission } from "../hooks/useNotificationPermission";
import { useSemester } from "../context/SemesterContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLecturesForDate } from "../utils/timetableUtils";
import html2canvasLib from "html2canvas";
import { jsPDF as jsPDFLib } from "jspdf";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusConfig = {
  full: {
    label: "Full Day",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-500/30",
    tile:  "bg-emerald-100/90 text-emerald-900 border-emerald-300/80 dark:bg-[#0c2a1e] dark:text-emerald-200 dark:border-emerald-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.12)]",
  },
  partial: {
    label: "Partial",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 border border-amber-300/80 dark:border-amber-500/30",
    tile:  "bg-amber-100/90 text-amber-900 border-amber-300/80 dark:bg-[#2d1c08] dark:text-amber-200 dark:border-amber-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(245,158,11,0.12)]",
  },
  absent: {
    label: "Absent",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-300/80 dark:border-rose-500/30",
    tile:  "bg-rose-100/90 text-rose-900 border-rose-300/80 dark:bg-[#2c0e14] dark:text-rose-200 dark:border-rose-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(244,63,94,0.12)]",
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
};

const exportPalette = {
  full:        { background: "#12352a", text: "#d1fae5" },
  partial:     { background: "#3a2e12", text: "#fde68a" },
  absent:      { background: "#3b1a1a", text: "#fecaca" },
  holiday:     { background: "#18181b", text: "#bae6fd" },
  exam:        { background: "#2b1b3f", text: "#e9d5ff" },
  none:        { background: "#09090b", text: "#e4e4e7" },
  border:      "#27272a",
  muted:       "#a1a1aa",
  surface:     "#09090b",
  softSurface: "#18181b",
};

const lectureStatusStyles = {
  present:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30",
  partial:   "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30",
  absent:    "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30",
  cancelled: "bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700",
  free:      "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30",
  holiday:   "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30",
  exam:      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30",
  pending:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800",
};

const optionStyles = {
  present: {
    label: "Present",
    selected: "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-300/60 dark:hover:border-emerald-500/20 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5"
  },
  absent: {
    label: "Absent",
    selected: "border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-rose-300/60 dark:hover:border-rose-500/20 hover:bg-rose-50/20 dark:hover:bg-rose-500/5"
  },
  free: {
    label: "Free",
    selected: "border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-sky-300/60 dark:hover:border-sky-500/20 hover:bg-sky-50/20 dark:hover:bg-sky-500/5"
  },
  cancelled: {
    label: "Cancelled",
    selected: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 ring-2 ring-zinc-500/20",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40"
  }
};

function parseDateString(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDayStatus({ lectures, isWeekend, hasEntry, dayType, hasScheduledLectures }) {
  if (dayType === "exam")    return "exam";
  if (dayType === "holiday") return "holiday";

  const presentCount   = lectures.filter(l => l.status === "present" || l.status === "free").length;
  const absentCount    = lectures.filter(l => l.status === "absent").length;
  const cancelledCount = lectures.filter(l => l.status === "cancelled").length;

  if (presentCount > 0 && absentCount === 0) return "full";
  if (absentCount > 0 && presentCount === 0) return "absent";
  if (presentCount > 0 && absentCount > 0)   return "partial";
  if (lectures.length > 0 && cancelledCount === lectures.length) return "holiday";

  // If there are lectures scheduled in the timetable/schedule for this day,
  // it is an active class day awaiting attendance - NOT a holiday!
  if (hasScheduledLectures) return "none";

  // Only if no lectures are scheduled does a weekend default to holiday
  if (isWeekend) return "holiday";

  if (lectures.length === 0 && hasEntry && dayType === "holiday") return "holiday";

  return "none";
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function buildReminderTriggerTime(dateString, timeString) {
  if (!dateString) return null;
  const timeValue = timeString || "00:00";
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes]   = timeValue.split(":").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, isNaN(hours) ? 0 : hours, isNaN(minutes) ? 0 : minutes);
}

function formatDateKey(date) {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day   = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Calendar() {
  const {
    currentSemester,
    addReminder,
    removeReminder,
    updateReminder,
    markDayStatus,
    markDayLectureStatuses,
    updateDayLectures,
    resetDayLecturesToDefault,
    removeDayAttendance,
  } = useSemester();

  const { showModal: showNotifModal, requestPermissionIfNeeded, onAllow, onDismiss } =
    useNotificationPermission();

  const attendanceData = useMemo(
    () => currentSemester.attendanceData ?? [],
    [currentSemester.attendanceData]
  );
  const reminders = useMemo(
    () => currentSemester.reminders ?? [],
    [currentSemester.reminders]
  );

  const [selectedDay, setSelectedDay] = useState(null);
  const activeSelectedDay = selectedDay;

  const [allRemindersOpen,  setAllRemindersOpen]  = useState(false);
  const [addReminderOpen,   setAddReminderOpen]   = useState(false);
  const [backfillModalOpen, setBackfillModalOpen] = useState(false);
  const [editingReminder,   setEditingReminder]   = useState(null);
  const [activeDrawer,      setActiveDrawer]      = useState(null); // null | 'partial' | 'edit'
  const editTimetableOpen = activeDrawer === "edit";
  const partialMarkOpen   = activeDrawer === "partial";
  const [partialSelection,  setPartialSelection]  = useState({});
  const [isDesktop,         setIsDesktop]         = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);
  const exportRef = useRef(null);

  const [reminderForm, setReminderForm] = useState({ title: "", date: "", time: "" });

  const [activeMonthDate, setActiveMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
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
    const now = new Date();
    setMonthDirection(0);
    setActiveMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }, [currentSemester.id]);

  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);

  const monthLabel      = formatMonthLabel(activeMonthDate);
  const year            = activeMonthDate.getFullYear();
  const monthIndex      = activeMonthDate.getMonth();
  const daysInMonth     = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekdayIndex = new Date(year, monthIndex, 1).getDay();

  const subjectsById = new Map((currentSemester.subjects ?? []).map(s => [s.id, s]));

  const entriesByDay = new Map();
  attendanceData.forEach((entry) => {
    const parsed = parseDateString(entry.date);
    if (parsed && parsed.getFullYear() === year && parsed.getMonth() === monthIndex) {
      entriesByDay.set(parsed.getDate(), entry);
    }
  });

  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date      = new Date(year, monthIndex, dayNumber);
    const dateKey   = formatDateKey(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dayEntry  = entriesByDay.get(dayNumber);
    const timetableLectures = getLecturesForDate(dateKey, currentSemester);
    const lectures  = dayEntry?.lectures ?? [];
    const hasScheduledLectures = timetableLectures.length > 0 || lectures.length > 0;
    const status    = getDayStatus({
      lectures,
      isWeekend,
      hasEntry: Boolean(dayEntry),
      dayType: dayEntry?.dayType,
      hasScheduledLectures,
    });
    const isToday   = dateKey === todayKey;
    return { dayNumber, status, date, dayEntry, isWeekend, isToday };
  });

  const loggedDays = useMemo(() => {
    return calendarDays.map((day) => {
      const dateKey = day.date ? formatDateKey(day.date) : "";
      const timetableLectures = dateKey ? getLecturesForDate(dateKey, currentSemester) : [];

      let displayLectures = [];
      if (day.dayEntry?.lectures && day.dayEntry.lectures.length > 0) {
        displayLectures = day.dayEntry.lectures;
      } else {
        displayLectures = timetableLectures.map((l) => ({
          subjectId: l.subjectId,
          type: l.type,
          status: "none",
        }));
      }

      const subjectsText = displayLectures
        .map((l) => {
          const sub = (currentSemester.subjects ?? []).find((s) => s.id === l.subjectId);
          const subName = sub ? sub.name : l.subjectId;
          const statusLabel =
            l.status === "present"
              ? "Present"
              : l.status === "absent"
              ? "Absent"
              : l.status === "cancelled"
              ? "Cancelled"
              : l.status === "free"
              ? "Free"
              : l.status === "pending"
              ? "Pending"
              : "No Data";
          return `${subName}: ${statusLabel}`;
        })
        .join(" | ");

      const defaultStatus =
        day.status === "holiday"
          ? "Holiday"
          : day.status === "exam"
          ? "Exam Day"
          : "No Data";

      return {
        dateStr: day.date
          ? day.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", weekday: "short" })
          : `${day.dayNumber} ${monthLabel}`,
        statusLabel: statusConfig[day.status].label,
        statusKey: day.status,
        subjectsText: subjectsText || defaultStatus,
      };
    });
  }, [calendarDays, currentSemester, monthLabel]);

  const leadingBlanks = Array.from({ length: startWeekdayIndex }, (_, i) => ({ key: `blank-${i}`, empty: true }));

  const statusCounts = calendarDays.reduce(
    (acc, item) => { acc[item.status] += 1; return acc; },
    { full: 0, partial: 0, absent: 0, holiday: 0, exam: 0, none: 0 }
  );

  const totalMarkedDays    = calendarDays.filter(d => d.status !== "none").length;
  const attendedDays       = calendarDays.filter(d => ["full", "partial", "exam"].includes(d.status)).length;
  const attendanceThisMonth = totalMarkedDays ? Math.round((attendedDays / totalMarkedDays) * 100) : 0;

  const entriesThisMonth = attendanceData.filter((entry) => {
    const parsed = parseDateString(entry.date);
    return parsed && parsed.getFullYear() === year && parsed.getMonth() === monthIndex;
  });

  const { totalClasses, totalAttended } = entriesThisMonth.reduce(
    (acc, entry) => {
      (entry.lectures ?? []).forEach((lecture) => {
        const status = lecture.status ?? "pending";
        if (["present", "absent", "partial"].includes(status)) {
          acc.totalClasses += 1;
          if (status === "present" || status === "partial") acc.totalAttended += 1;
        }
      });
      return acc;
    },
    { totalClasses: 0, totalAttended: 0 }
  );
  const overallAttendancePct = totalClasses ? Math.round((totalAttended / totalClasses) * 100) : 0;

  // Previous month delta
  const previousMonthDate = new Date(year, monthIndex - 1, 1);
  const prevYear  = previousMonthDate.getFullYear();
  const prevMonth = previousMonthDate.getMonth();
  const prevDays  = new Date(prevYear, prevMonth + 1, 0).getDate();
  const prevEntries = attendanceData.filter((entry) => {
    const parsed = parseDateString(entry.date);
    return parsed && parsed.getFullYear() === prevYear && parsed.getMonth() === prevMonth;
  });

  let presentDays = 0, markedDays = 0;
  for (let day = 1; day <= prevDays; day++) {
    const entry   = prevEntries.find(item => parseDateString(item.date)?.getDate() === day);
    if (!entry) continue;
    const present = entry.lectures?.some(l => l.status === "present");
    const absent  = entry.lectures?.some(l => l.status === "absent");
    if (present || absent || entry.lectures?.length === 0) markedDays++;
    if (present) presentDays++;
  }
  const prevPct              = markedDays ? Math.round((presentDays / markedDays) * 100) : 0;
  const monthOverMonthDelta  = attendanceThisMonth - prevPct;

  const prevEntriesByDay = new Map();
  prevEntries.forEach(entry => {
    const parsed = parseDateString(entry.date);
    if (parsed) prevEntriesByDay.set(parsed.getDate(), entry);
  });

  const previousStatusCounts = { full: 0, partial: 0, absent: 0, holiday: 0, exam: 0, none: 0 };
  for (let day = 1; day <= prevDays; day++) {
    const date      = new Date(prevYear, prevMonth, day);
    const dateKey   = formatDateKey(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const entry     = prevEntriesByDay.get(day);
    const prevTtLectures = getLecturesForDate(dateKey, currentSemester);
    const lectures  = entry?.lectures ?? [];
    const hasScheduledLectures = prevTtLectures.length > 0 || lectures.length > 0;
    const status    = getDayStatus({
      lectures,
      isWeekend,
      hasEntry: Boolean(entry),
      dayType: entry?.dayType,
      hasScheduledLectures,
    });
    previousStatusCounts[status]++;
  }

  // Calculate streak and perfect weeks properly
  let longestStreak = 0;
  let currentStreak = 0;
  calendarDays.forEach((day) => {
    if (day.status === "full") {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else if (day.status === "partial" || day.status === "absent") {
      currentStreak = 0;
    }
  });

  const weeksMap = new Map();
  calendarDays.forEach((day) => {
    const d = day.date;
    const Sunday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const weekKey = formatDateKey(Sunday);
    if (!weeksMap.has(weekKey)) {
      weeksMap.set(weekKey, []);
    }
    weeksMap.get(weekKey).push(day);
  });

  let perfectWeeksCount = 0;
  weeksMap.forEach((daysInWeek) => {
    const hasFull = daysInWeek.some(d => d.status === "full");
    const hasBunkOrAbsent = daysInWeek.some(d => d.status === "partial" || d.status === "absent");
    if (hasFull && !hasBunkOrAbsent) {
      perfectWeeksCount++;
    }
  });

  const monthlyHighlights = [
    { title: "Longest streak",        value: `${longestStreak} days`,                  detail: "Days with full attendance" },
    { title: "Perfect weeks",         value: `${perfectWeeksCount} weeks`,             detail: "Weeks without absences or bunks" },
    { title: "Attendance this month", value: `${attendanceThisMonth}%`,                               detail: `${monthOverMonthDelta >= 0 ? "+" : ""}${monthOverMonthDelta}% vs last month` },
  ];

  const visibleReminders  = reminders.slice(0, 3);
  const hasMoreReminders  = reminders.length > 3;
  const formatDelta       = (delta) => `${delta >= 0 ? "+" : ""}${delta} vs last month`;
  const reminderDateLabel = (dateString) => {
    const parsed = parseDateString(dateString);
    if (!parsed) return dateString;
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const handleExportMonth = async () => {
    const html2canvas = html2canvasLib || window.html2canvas;
    const jsPDF       = jsPDFLib || window.jspdf?.jsPDF;
    if (!html2canvas || !jsPDF || !exportRef.current) return;

    // Measure row positions BEFORE html2canvas to avoid any DOM interference
    const rows = Array.from(exportRef.current.querySelectorAll(".export-log-row"));
    const parentRect = exportRef.current.getBoundingClientRect();
    const rowBoundaries = rows.map(row => {
      const rect = row.getBoundingClientRect();
      return {
        top: rect.top - parentRect.top,
        bottom: rect.bottom - parentRect.top
      };
    });

    const scale = 2;
    const canvas = await html2canvas(exportRef.current, { scale, useCORS: true, backgroundColor: exportPalette.surface });
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const pdfScale = pageWidth / canvas.width;
    // const pageHeightPx = pageHeight / pdfScale; // one A4 page in canvas pixels

    let currentY = 0;
    const canvasHeight = canvas.height;
    let isFirstPage = true;

    while (currentY < canvasHeight) {
      // Pages 2+ have a 20pt top margin, so less vertical space is available
      const topMarginPt = isFirstPage ? 0 : 20;
      const effectivePageHeightPx = (pageHeight - topMarginPt) / pdfScale;

      let sliceHeight = Math.min(effectivePageHeightPx, canvasHeight - currentY);
      const targetY = currentY + effectivePageHeightPx;

      // Only adjust if this isn't the last page
      if (targetY < canvasHeight) {
        const currentYDom = currentY / scale;
        const targetYDom  = targetY / scale;

        // Find all row bottoms that fit entirely within this page slice.
        // Each row.bottom is a safe place to split (right after a complete row).
        const safeSplitPoints = rowBoundaries
          .filter(row => row.bottom > currentYDom + 20 && row.bottom <= targetYDom - 5)
          .map(row => row.bottom + 4); // 4px buffer below row

        if (safeSplitPoints.length > 0) {
          // Pick the LAST safe split point to maximize content per page
          const bestSplitDom = safeSplitPoints[safeSplitPoints.length - 1];
          sliceHeight = (bestSplitDom * scale) - currentY;
        }
        // If no rows are in range (e.g., calendar/stats area), use default
      }

      // Create page canvas and copy the slice
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = exportPalette.surface;
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      // Add page to PDF
      if (!isFirstPage) pdf.addPage();
      pdf.setFillColor(exportPalette.surface);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      const renderedHeight = sliceHeight * pdfScale;
      pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, topMarginPt, pageWidth, renderedHeight);

      currentY += sliceHeight;
      isFirstPage = false;
    }

    pdf.save(`attendance-${year}-${String(monthIndex + 1).padStart(2, "0")}.pdf`);
  };

  // Ask for permission before saving the reminder
  const handleAddReminder = async (event) => {
    event.preventDefault();
    if (!reminderForm.title || !reminderForm.date) return;

    // Show our custom permission modal if not yet granted
    await requestPermissionIfNeeded();
    // We proceed even if not granted — the reminder will still be saved,
    // and we'll fall back to window.alert at trigger time if needed.

    const triggerAt = buildReminderTriggerTime(reminderForm.date, reminderForm.time);

    if (editingReminder) {
      updateReminder(editingReminder.id, {
        title:     reminderForm.title,
        date:      reminderForm.date,
        time:      reminderForm.time,
        triggerAt: triggerAt?.toISOString() ?? null,
        delivered: false,
      });
    } else {
      addReminder({
        id:        `${Date.now()}`,
        title:     reminderForm.title,
        date:      reminderForm.date,
        time:      reminderForm.time,
        triggerAt: triggerAt?.toISOString() ?? null,
        delivered: false,
      });
    }
    handleCloseReminderModal();
  };

  const scheduleReminderNotification = useCallback((reminder) => {
    const triggerTime = reminder.triggerAt
      ? new Date(reminder.triggerAt)
      : buildReminderTriggerTime(reminder.date, reminder.time);
    if (!triggerTime || isNaN(triggerTime.getTime())) return;
    const delay = Math.max(triggerTime.getTime() - Date.now(), 0);

    return window.setTimeout(async () => {
      const body = `Reminder for ${reminder.date}${reminder.time ? ` at ${reminder.time}` : ""}`;

      if (Notification.permission === "granted") {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await registration.showNotification(reminder.title, { body, tag: `reminder-${reminder.id}`, renotify: true });
            } else {
              new Notification(reminder.title, { body });
            }
          } catch {
            new Notification(reminder.title, { body });
          }
        } else {
          new Notification(reminder.title, { body });
        }
      } else {
        window.alert(`Reminder: ${reminder.title}\n${reminder.date}${reminder.time ? ` at ${reminder.time}` : ""}`);
      }
      removeReminder(reminder.id);
    }, delay);
  }, [removeReminder]);

  const handleCloseReminderModal = () => {
    setReminderForm({ title: "", date: "", time: "" });
    setEditingReminder(null);
    setAddReminderOpen(false);
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setReminderForm({ title: reminder.title ?? "", date: reminder.date ?? "", time: reminder.time ?? "" });
    setAddReminderOpen(true);
  };

  const handleDeleteReminder = (reminderId) => {
    if (!reminderId) return;
    removeReminder(reminderId);
    if (editingReminder?.id === reminderId) handleCloseReminderModal();
  };

  const handleDayStatusUpdate = (status) => {
    if (!selectedDay?.date) return;
    const date = formatDateKey(selectedDay.date);
    markDayStatus(date, status);
    setSelectedDay(prev => prev ? { ...prev, status: status === "present" ? "full" : status } : prev);
  };

  // Lock background body scroll when selectedDay is open
  useEffect(() => {
    if (selectedDay) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [Boolean(selectedDay)]);

  // Handle ESC key to dismiss day modal or its drawer
  useEffect(() => {
    if (!selectedDay) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeDrawer) {
          setActiveDrawer(null);
          return;
        }
        setSelectedDay(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDay, activeDrawer]);

  const handlePartialAttendanceSave = () => {
    if (!selectedDay?.date) return;
    const date   = formatDateKey(selectedDay.date);
    markDayLectureStatuses?.(date, partialSelection);
    const values       = Object.values(partialSelection);
    const attendedCount = values.filter(s => s === "present" || s === "free").length;
    const absentCount   = values.filter(s => s === "absent").length;
    setSelectedDay(prev => prev ? {
      ...prev,
      status: attendedCount === 0 && absentCount > 0 ? "absent"
            : absentCount  === 0 && attendedCount > 0 ? "full"
            : "partial",
    } : prev);
    setActiveDrawer(null);
  };

  const setPartialStatus = (key, status) => {
    setPartialSelection(prev => ({ ...prev, [key]: status }));
  };

  const selectedDayDateKey  = selectedDay?.date ? formatDateKey(selectedDay.date) : null;
  const timetableLectures   = selectedDayDateKey ? getLecturesForDate(selectedDayDateKey, currentSemester) : [];
  const selectedDayLectures = selectedDay?.dayEntry?.lectures?.length
    ? selectedDay.dayEntry.lectures
    : (selectedDay?.dayEntry?.dayType === "holiday" || selectedDay?.dayEntry?.dayType === "exam")
    ? []
    : timetableLectures.map(lecture => ({ ...lecture, status: null }));

  useEffect(() => {
    const timeouts = reminders
      .filter(r => !r.delivered)
      .map(r => scheduleReminderNotification(r));
    return () => timeouts.forEach(id => id && window.clearTimeout(id));
  }, [reminders, scheduleReminderNotification]);

  useEffect(() => {
    if (!selectedDay?.date) return;
    const dateKey   = formatDateKey(selectedDay.date);
    const liveEntry = attendanceData.find(d => d.date === dateKey);
    const isWeekend = selectedDay.date.getDay() === 0 || selectedDay.date.getDay() === 6;
    const ttLectures = getLecturesForDate(dateKey, currentSemester);
    const lectures  = liveEntry?.lectures ?? [];
    const hasScheduledLectures = ttLectures.length > 0 || lectures.length > 0;
    const liveStatus = getDayStatus({
      lectures,
      isWeekend,
      hasEntry: Boolean(liveEntry),
      dayType: liveEntry?.dayType,
      hasScheduledLectures,
    });
    setSelectedDay(prev => {
      if (!prev) return prev;
      if (prev.dayEntry === liveEntry && prev.status === liveStatus) return prev;
      return { ...prev, dayEntry: liveEntry, status: liveStatus };
    });
  }, [attendanceData, selectedDayDateKey, currentSemester]);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-6">

      <NotificationPermissionModal
        open={showNotifModal}
        onAllow={onAllow}
        onDismiss={onDismiss}
      />

      <div
        ref={exportRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "800px",
          backgroundColor: exportPalette.surface,
          color: "#f9fafb",
          padding: "24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: exportPalette.muted, margin: 0 }}>
            Attendance Summary
          </p>
          <h2 style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>{monthLabel}</h2>
        </div>
        <div style={{
          border: `1px solid ${exportPalette.border}`,
          backgroundColor: exportPalette.surface,
          borderRadius: "16px",
          padding: "20px"
        }}>
          {/* Weekdays header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "8px",
            color: exportPalette.muted,
            marginBottom: "12px"
          }}>
            {weekDays.map(day => (
              <div key={`export-${day}`} style={{
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "8px"
          }}>
            {leadingBlanks.map(blank => (
              <div key={`export-${blank.key}`} style={{ height: "64px" }} />
            ))}
            {calendarDays.map(day => (
              <div key={`export-day-${day.dayNumber}`} style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: "8px",
                padding: "6px 8px",
                height: "64px",
                boxSizing: "border-box",
                border: `1px solid ${exportPalette.border}`,
                backgroundColor: exportPalette[day.status]?.background ?? exportPalette.none.background,
                color: exportPalette[day.status]?.text ?? exportPalette.none.text
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "10px",
                  color: exportPalette.muted
                }}>
                  <span style={{ color: exportPalette.muted }}>{day.dayNumber}</span>
                  <span style={{
                    height: "6px",
                    width: "6px",
                    borderRadius: "50%",
                    backgroundColor: "currentColor",
                    opacity: 0.6,
                    color: exportPalette[day.status]?.text ?? exportPalette.none.text
                  }} />
                </div>
                <p style={{
                  fontSize: "7.5px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: 0,
                  lineHeight: "1.3",
                  whiteSpace: "nowrap",
                  overflow: "visible"
                }}>
                  {statusConfig[day.status].label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats cards row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px"
        }}>
          {[
            { label: "Total attendance", value: totalAttended },
            { label: "Classes conducted", value: totalClasses },
            { label: "Overall percentage", value: `${overallAttendancePct}%` }
          ].map((item) => (
            <div key={`export-summary-${item.label}`} style={{
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
              border: `1px solid ${exportPalette.border}`,
              backgroundColor: exportPalette.softSurface,
              boxSizing: "border-box"
            }}>
              <p style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: exportPalette.muted,
                margin: "0 0 8px 0"
              }}>
                {item.label}
              </p>
              <p style={{
                fontSize: "24px",
                fontWeight: "600",
                margin: 0,
                color: "#ffffff"
              }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* DETAILED DAILY LOGS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: exportPalette.muted, margin: 0 }}>
            Detailed Daily Logs
          </p>
          <div style={{ borderRadius: "16px", overflow: "hidden", border: `1px solid ${exportPalette.border}`, backgroundColor: exportPalette.softSurface }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${exportPalette.border}`, color: exportPalette.muted, backgroundColor: `${exportPalette.surface}80` }}>
                  <th style={{ padding: "12px", width: "25%", fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                  <th style={{ padding: "12px", width: "25%", fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Status</th>
                  <th style={{ padding: "12px", width: "50%", fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject-wise Logs</th>
                </tr>
              </thead>
              <tbody>
                {loggedDays.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: "16px", textAlign: "center", color: exportPalette.muted, fontStyle: "italic" }}>
                      No attendance records marked for this month.
                    </td>
                  </tr>
                ) : (
                  loggedDays.map((row, idx) => (
                    <tr key={idx} className="export-log-row" style={{ borderBottom: idx === (loggedDays.length - 1) ? "0" : `1px solid ${exportPalette.border}50` }}>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#e5e7eb", verticalAlign: "top" }}>{row.dateStr}</td>
                      <td style={{ padding: "12px", verticalAlign: "top" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          backgroundColor: exportPalette[row.statusKey]?.background ?? exportPalette.none.background,
                          color: exportPalette[row.statusKey]?.text ?? exportPalette.none.text,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          fontSize: "9px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          {row.statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#9ca3af", lineHeight: "1.5", verticalAlign: "top" }}>{row.subjectsText}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 rounded-full shadow-xs">
              📅 ATTENDANCE CALENDAR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-[Poppins]">
            Your attendance,{" "}
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              beautifully tracked
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
            See full-day, partial, absent, and holiday patterns at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <button type="button" onClick={() => setBackfillModalOpen(true)}
            className="rounded-xl border border-amber-500/30 bg-white dark:bg-[#0e1017] hover:bg-amber-500/10 text-amber-600 dark:text-amber-300 px-3.5 sm:px-4 py-2 text-xs font-bold shadow-xs transition duration-150 hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5">
            <span>⚡ Backfill Past Days</span>
          </button>
          <button type="button" onClick={handleExportMonth}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e1017] hover:border-zinc-300 dark:hover:border-zinc-700 px-3.5 sm:px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 shadow-xs transition duration-150 hover:-translate-y-0.5 cursor-pointer">
            Export Month
          </button>
          <button type="button" onClick={() => { setEditingReminder(null); setReminderForm({ title: "", date: "", time: "" }); setAddReminderOpen(true); }}
            className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-3.5 sm:px-4 py-2 text-xs font-black shadow-md transition duration-150 hover:-translate-y-0.5 cursor-pointer">
            + Add Reminder
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Full days",    value: statusCounts.full,    change: formatDelta(statusCounts.full    - previousStatusCounts.full),    status: "full"    },
          { title: "Partial days", value: statusCounts.partial, change: formatDelta(statusCounts.partial - previousStatusCounts.partial), status: "partial" },
          { title: "Absences",     value: statusCounts.absent,  change: formatDelta(statusCounts.absent  - previousStatusCounts.absent),  status: "absent"  },
          { title: "Holidays",     value: statusCounts.holiday, change: formatDelta(statusCounts.holiday - previousStatusCounts.holiday), status: "holiday" },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090d] p-4 shadow-sm hover:border-zinc-300 dark:hover:border-indigo-500/30 hover:shadow-lg dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.12)] transition-all duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{item.title}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusConfig[item.status].badge}`}>{statusConfig[item.status].label}</span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-black text-zinc-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{item.change}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2.1fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090d] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Calendar View</p>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-[Poppins]">{monthLabel}</h2>
            </div>
            <div className="flex items-center gap-5">
              <button type="button" onClick={handlePrevMonth}
                aria-label="Previous month" className="text-2xl leading-none text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 transition hover:scale-110 dark:hover:text-white cursor-pointer">←</button>
              <button type="button" onClick={handleNextMonth}
                aria-label="Next month" className="text-2xl leading-none text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 transition hover:scale-110 dark:hover:text-white cursor-pointer">→</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {weekDays.map(day => <div key={day} className="text-center">{day}</div>)}
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/70 bg-zinc-100/70 dark:bg-[#050508] p-2 overflow-hidden relative">
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
                className="grid grid-cols-7 gap-1 sm:gap-2 cursor-grab active:cursor-grabbing"
              >
                {leadingBlanks.map(blank => <div key={blank.key} className="h-12 sm:h-14 rounded-lg border border-transparent" />)}
                {calendarDays.map((day) => (
                  <button key={day.dayNumber} type="button"
                    onClick={() => setSelectedDay({ day: day.dayNumber, status: day.status, date: day.date, dayEntry: day.dayEntry })}
                    className={`group relative overflow-hidden flex flex-col justify-between min-h-[3.25rem] sm:min-h-[3.75rem] h-auto rounded-xl border p-1.5 text-[11px] sm:text-sm font-semibold transition-all duration-150 transform-gpu ${statusConfig[day.status].tile} ${
                      day.isToday ? "ring-2 ring-indigo-500 dark:ring-indigo-400 !opacity-100 shadow-[0_0_14px_rgba(99,102,241,0.4)]" : ""
                    } hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-lg cursor-pointer`}>
                    <div className="w-full flex items-center justify-between text-[10px] sm:text-xs opacity-75 font-bold">
                      <span>{day.dayNumber}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    </div>
                    <p className="mt-2 w-full text-center text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider truncate pb-0.5">{statusConfig[day.status].label}</p>
                    {day.status === "holiday" && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-300 dark:stroke-zinc-800 opacity-60 dark:opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="0" x2="100" y2="100" strokeWidth="1.5" />
                        <line x1="100" y1="0" x2="0" y2="100" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-end pt-1">
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).filter(([key]) => key !== "none").map(([key, config]) => (
                <span key={key} className={`rounded-full px-3 py-1 text-xs font-bold ${config.badge}`}>{config.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-5 shadow-sm backdrop-blur-xl">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">Monthly Highlights</h3>
            <div className="mt-4 space-y-3">
              {monthlyHighlights.map(item => (
                <div key={item.title} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{item.title}</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">{item.value}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">Reminders</h3>
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">{reminders.length} items</span>
            </div>
            <div className="mt-4 space-y-3">
              {visibleReminders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 text-center">
                  No reminders scheduled for this month.
                </div>
              ) : (
                visibleReminders.map(note => (
                  <div key={note.id ?? note.title} className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{note.title}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{reminderDateLabel(note.date)}{note.time ? ` · ${note.time}` : ""}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => handleEditReminder(note)}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteReminder(note.id)}
                        className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-200 cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {hasMoreReminders && (
              <button type="button" onClick={() => setAllRemindersOpen(true)}
                className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                View more
              </button>
            )}
          </div>
        </div>
      </section>

      <Modal open={allRemindersOpen} onClose={() => setAllRemindersOpen(false)} size="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">All Reminders</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Every reminder you have scheduled</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {reminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-4 text-sm text-zinc-500 dark:text-zinc-400">No reminders yet.</div>
          ) : (
            reminders.map(note => (
              <div key={`all-${note.id ?? note.title}`} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{note.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{reminderDateLabel(note.date)}{note.time ? ` · ${note.time}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEditReminder(note)}
                      className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition">Edit</button>
                    <button type="button" onClick={() => handleDeleteReminder(note.id)}
                      className="rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-200">Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal open={addReminderOpen} onClose={handleCloseReminderModal} size="lg" showCloseButton={false}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{editingReminder ? "Edit Reminder" : "Add Reminder"}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Schedule a reminder for this device.</p>
          </div>
        </div>
        <form className="mt-5 space-y-4" onSubmit={handleAddReminder}>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
            <input type="text" value={reminderForm.title}
              onChange={e => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              placeholder="Weekly lab reminder" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
              <input type="date" value={reminderForm.date}
                onChange={e => setReminderForm(prev => ({ ...prev, date: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100" required />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Time</label>
              <input type="time" value={reminderForm.time}
                onChange={e => setReminderForm(prev => ({ ...prev, time: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleCloseReminderModal}
              className="rounded-full border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">Cancel</button>
            {editingReminder && (
              <button type="button" onClick={() => handleDeleteReminder(editingReminder.id)}
                className="rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-200">Delete Reminder</button>
            )}
            <button type="submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900 cursor-pointer hover:scale-[1.02] transition">Save Reminder</button>
          </div>
        </form>
      </Modal>

      {/* Unified Day Attendance & Marking Modal (with Expandable Partial Marking) */}
      {createPortal(
        <AnimatePresence>
          {Boolean(selectedDay) && (
            <motion.div
              key="day-unified-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onClick={() => {
                setSelectedDay(null);
                setActiveDrawer(null);
              }}
              className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm overflow-hidden"
            >
              <motion.div
                key="day-unified-modal-card"
                onClick={(e) => e.stopPropagation()}
                drag={activeDrawer ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.8 }}
                dragSnapToOrigin={true}
                onDragEnd={(e, info) => {
                  if (!activeDrawer && (info.offset.y > 100 || info.velocity.y > 250)) {
                    setSelectedDay(null);
                    setActiveDrawer(null);
                  }
                }}
                initial={{ y: "100%", opacity: 0.95 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{
                  y: "100%",
                  opacity: 0.95,
                  transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                }}
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                className={`relative z-10 w-full ${
                  partialMarkOpen || editTimetableOpen ? "max-w-[1280px]" : "max-w-4xl"
                } rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0c0d12] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800/90 shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh] sm:max-h-[88vh] transition-[max-width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]`}
              >
              {/* Kokonut-style drag handle bar */}
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700/80 rounded-full mx-auto mt-3 mb-1 shrink-0" />

              {/* Content sections with divider in between */}
              <div className="flex flex-col lg:flex-row items-stretch flex-1 min-h-[420px] overflow-y-auto lg:overflow-hidden no-scrollbar">
                
                {/* SECTION 1: Day Details & Lectures */}
                <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[Poppins]">
                        {activeSelectedDay?.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Attendance details for the day</p>
                    </div>
                    {activeSelectedDay?.status && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig[activeSelectedDay.status]?.badge}`}>
                        {statusConfig[activeSelectedDay.status]?.label}
                      </span>
                    )}
                  </div>

                  {/* Middle: Centered if fewer lectures, scrollable if many */}
                  <div className="my-auto py-3 flex flex-col justify-center">
                    <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1 no-scrollbar">
                      {selectedDayLectures?.length ? (
                        selectedDayLectures.map((lecture, index) => {
                          const subject     = subjectsById.get(lecture.subjectId);
                          const statusLabel = lecture.status || "pending";
                          return (
                            <div
                              key={`${activeSelectedDay.day}-${lecture.subjectId}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/70 px-3.5 py-2.5 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                  {subject?.name ?? lecture.subjectId}
                                </p>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                                  {lecture.type ?? subject?.type ?? "lecture"}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize shrink-0 ${
                                  lectureStatusStyles[statusLabel] || lectureStatusStyles.pending
                                }`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                          {activeSelectedDay?.status === "holiday" ? "Holiday · No lectures" : "No lectures recorded for this day."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Mark Attendance */}
                <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800/80">
                  {/* Header */}
                  <div className="flex flex-col gap-0.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[Poppins]">
                      Mark Attendance
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                      Choose a quick status or update details below.
                    </p>
                  </div>

                  {/* Middle: Centered */}
                  <div className="my-auto py-3 flex flex-col justify-center space-y-3.5">
                    {/* Quick Full Day Status */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Quick Full Day Status
                      </span>
                      <div className="mt-1.5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleDayStatusUpdate("present")}
                          className="flex items-center gap-2 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-2 text-left text-emerald-800 dark:text-emerald-300 transition hover:-translate-y-0.5 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/10 hover:shadow-md cursor-pointer active:scale-95"
                        >
                          <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs leading-tight truncate">Full Present</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">All classes attended</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDayStatusUpdate("absent")}
                          className="flex items-center gap-2 rounded-xl border border-rose-200/80 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 p-2 text-left text-rose-800 dark:text-rose-300 transition hover:-translate-y-0.5 hover:bg-rose-100/60 dark:hover:bg-rose-500/10 hover:shadow-md cursor-pointer active:scale-95"
                        >
                          <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs leading-tight truncate">Full Absent</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">Missed all classes</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDayStatusUpdate("holiday")}
                          className="flex items-center gap-2 rounded-xl border border-sky-200/80 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-500/5 p-2 text-left text-sky-800 dark:text-sky-300 transition hover:-translate-y-0.5 hover:bg-sky-100/60 dark:hover:bg-sky-500/10 hover:shadow-md cursor-pointer active:scale-95"
                        >
                          <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs leading-tight truncate">Holiday</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">No classes scheduled</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDayStatusUpdate("exam")}
                          className="flex items-center gap-2 rounded-xl border border-violet-200/80 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 p-2 text-left text-violet-800 dark:text-violet-300 transition hover:-translate-y-0.5 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 hover:shadow-md cursor-pointer active:scale-95"
                        >
                          <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs leading-tight truncate">Exam Day</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">Exam conducted</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Detailed & Timetable Options */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Detailed & Timetable Options
                      </span>
                      <div className="mt-1.5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (activeDrawer !== "partial") {
                              setPartialSelection(selectedDayLectures.reduce((acc, l) => {
                                const key = l.slotIndex != null ? `${l.subjectId}::${l.slotIndex}` : l.subjectId;
                                acc[key] = l.status ?? "absent";
                                return acc;
                              }, {}));
                              setActiveDrawer("partial");
                            } else {
                              setActiveDrawer(null);
                            }
                          }}
                          className={`flex items-center gap-2 rounded-xl border p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 ${
                            partialMarkOpen
                              ? "border-amber-400 bg-amber-100/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/40"
                              : "border-amber-200/80 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-500/10"
                          }`}
                        >
                          <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs leading-tight truncate">Partial Marking</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">
                              {partialMarkOpen ? "Expanded →" : "Mark individually"}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveDrawer(prev => (prev === "edit" ? null : "edit"));
                          }}
                          className={`flex items-center gap-2 rounded-xl border p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 ${
                            editTimetableOpen
                              ? "border-blue-400 bg-blue-100/80 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400/40"
                              : "border-blue-200/80 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 text-blue-800 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-500/10"
                          }`}
                        >
                          <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs leading-tight truncate">Edit Day's Lectures</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">
                              {editTimetableOpen ? "Expanded →" : "Change schedule"}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Destructive Action */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedDay?.date) return;
                          removeDayAttendance(formatDateKey(selectedDay.date));
                          setActiveDrawer(null);
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5 py-1.5 px-3 text-center text-rose-600 dark:text-rose-400 transition hover:bg-rose-100/50 dark:hover:bg-rose-500/10 cursor-pointer active:scale-95 font-bold text-xs uppercase tracking-wider"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Remove Attendance Data For This Day</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Expandable Side Drawer (Partial Marking OR Edit Day's Lectures) */}
                <AnimatePresence initial={false}>
                  {(partialMarkOpen || editTimetableOpen) && (
                    <motion.div
                      key="modal-section-3-drawer"
                      initial={isDesktop ? { width: 0, opacity: 0 } : { y: "100%" }}
                      animate={isDesktop ? { width: editTimetableOpen ? 480 : 390, opacity: 1 } : { y: 0 }}
                      exit={isDesktop ? { width: 0, opacity: 0 } : { y: "100%" }}
                      transition={
                        isDesktop
                          ? { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
                          : { duration: 0.38, ease: [0.32, 0.72, 0, 1] }
                      }
                      className={
                        isDesktop
                          ? "overflow-hidden shrink-0 flex flex-col justify-between border-l border-zinc-200 dark:border-zinc-800/80"
                          : "absolute inset-0 z-30 bg-white dark:bg-[#0c0d12] flex flex-col overflow-hidden"
                      }
                    >
                      <motion.div
                        key={editTimetableOpen ? "drawer-edit-timetable" : "drawer-partial-mark"}
                        initial={isDesktop ? { x: 40, opacity: 0 } : { opacity: 0 }}
                        animate={isDesktop ? { x: 0, opacity: 1 } : { opacity: 1 }}
                        exit={isDesktop ? { x: 80, opacity: 0 } : { opacity: 1 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full ${editTimetableOpen ? "lg:w-[480px]" : "lg:w-[390px]"} p-4 sm:p-5 flex flex-col justify-between h-full overflow-hidden`}
                      >
                        {editTimetableOpen ? (
                          <>
                            {/* Drag handle for mobile overlay view */}
                            <div className="lg:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                              <div>
                                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[Poppins]">
                                  Edit Day&apos;s Lectures
                                </h3>
                                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                                  Customize schedule for {activeSelectedDay?.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} only
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveDrawer(null)}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                title="Close Edit Schedule"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Middle: Day Lectures Editor */}
                            <div className="flex-1 min-h-0 py-3 lg:my-auto lg:max-h-[56vh] overflow-y-auto pr-1.5 no-scrollbar">
                              <DayLecturesEditor
                                date={formatDateKey(activeSelectedDay.date)}
                                initialLectures={selectedDayLectures}
                                subjects={currentSemester.subjects}
                                isCustom={Boolean(activeSelectedDay.dayEntry?.isCustomSchedule)}
                                dateLabel={activeSelectedDay.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                                onSave={(newLectures) => {
                                  const dateKey = formatDateKey(activeSelectedDay.date);
                                  updateDayLectures(dateKey, newLectures);
                                  setActiveDrawer(null);
                                }}
                                onCancel={() => setActiveDrawer(null)}
                                onResetToDefault={() => {
                                  const dateKey = formatDateKey(activeSelectedDay.date);
                                  resetDayLecturesToDefault(dateKey);
                                  setActiveDrawer(null);
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Drag handle for mobile overlay view */}
                            <div className="lg:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                              <div>
                                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[Poppins]">
                                  Mark Subject-Wise Status
                                </h3>
                                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                                  Pick Present, Absent, Free, or Cancelled for each lecture.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveDrawer(null)}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                title="Close Partial Marking"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Middle: Subject items */}
                            <div className="flex-1 min-h-0 py-3 flex flex-col justify-between overflow-hidden">
                              <div className="space-y-2.5 flex-1 min-h-0 lg:max-h-[44vh] overflow-y-auto pr-1 no-scrollbar">
                                {selectedDayLectures.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                                    No lectures found for this day.
                                  </div>
                                ) : (
                                  selectedDayLectures.map((lecture, idx) => {
                                    const subject = subjectsById.get(lecture.subjectId);
                                    const key = lecture.slotIndex != null ? `${lecture.subjectId}::${lecture.slotIndex}` : lecture.subjectId;
                                    const currentStatus = partialSelection[key] ?? "absent";
                                    return (
                                      <motion.div
                                        key={`partial-${key}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                          duration: 0.25,
                                          delay: 0.05 + idx * 0.03,
                                          ease: [0.16, 1, 0.3, 1],
                                        }}
                                        className="rounded-2xl p-3 border border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-[#07080c] space-y-2"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate block">
                                              {subject?.name ?? lecture.subjectId}
                                            </span>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                                              {lecture.type || subject?.type || "lecture"}
                                            </p>
                                          </div>
                                          {currentStatus && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                                              lectureStatusStyles[String(currentStatus).toLowerCase()] || lectureStatusStyles.pending
                                            }`}>
                                              {currentStatus}
                                            </span>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                          {["present", "absent", "free", "cancelled"].map((val) => {
                                            const style = optionStyles[val];
                                            const isSelected = currentStatus === val;
                                            return (
                                              <button
                                                key={`${key}-${val}`}
                                                type="button"
                                                onClick={() => setPartialStatus(key, val)}
                                                className={`rounded-lg border px-1.5 py-1 text-[11px] font-semibold capitalize transition duration-150 cursor-pointer text-center ${
                                                  isSelected ? style.selected : style.unselected
                                                }`}
                                              >
                                                {style.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* Bottom Actions for Section 3 */}
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0 flex gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveDrawer(null)}
                                className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition active:scale-95"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handlePartialAttendanceSave}
                                className="flex-1 py-2 px-3.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 shadow-sm cursor-pointer transition active:scale-95 text-center"
                              >
                                Save Partial Marking
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SINGLE COMMON MODAL FOOTER */}
              <div className="border-t border-zinc-200 dark:border-zinc-800/80 px-6 py-3 flex items-center justify-between shrink-0 bg-zinc-50/70 dark:bg-[#0a0b0f]/70">
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {partialMarkOpen
                    ? "Mark each lecture status then click Save Partial Marking"
                    : editTimetableOpen
                    ? "Edit schedule for this date and click Save & Apply"
                    : "Select a quick status or open partial marking to customize individual classes"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    setActiveDrawer(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-bold shadow-sm cursor-pointer transition-all duration-150 active:scale-95 shrink-0"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

      <QuickBackfillModal
        isOpen={backfillModalOpen}
        onClose={() => setBackfillModalOpen(false)}
      />
    </div>
  );
}