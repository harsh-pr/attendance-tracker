import Modal from "../components/Modal";
import { useSemester } from "../context/SemesterContext";
import { useRef, useState } from "react";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusConfig = {
  full: {
    label: "Full Day",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    tile:
      "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100",
  },
  partial: {
    label: "Partial",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    tile:
      "bg-amber-50/80 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100",
  },
  absent: {
    label: "Absent",
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    tile:
      "bg-rose-50/80 text-rose-900 dark:bg-rose-500/15 dark:text-rose-100",
  },
  holiday: {
    label: "Holiday",
    badge:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    tile:
      "bg-sky-50/80 text-sky-900 dark:bg-sky-500/15 dark:text-sky-100",
  },
  none: {
    label: "No Data",
    badge:
      "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
    tile:
      "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  },
};

const exportPalette = {
  full: { background: "#12352a", text: "#d1fae5" },
  partial: { background: "#3a2e12", text: "#fde68a" },
  absent: { background: "#3b1a1a", text: "#fecaca" },
  holiday: { background: "#0f2a3a", text: "#bae6fd" },
  none: { background: "#111827", text: "#e5e7eb" },
  border: "#1f2937",
  muted: "#9ca3af",
  surface: "#0b1120",
  softSurface: "#0f172a",
};

const lectureStatusStyles = {
  present:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  partial:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  absent:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  cancelled:
    "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
  free: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  pending:
    "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
};

const notificationOptions = [
  { value: "Mobile", label: "Mobile" },
  { value: "Desktop", label: "Desktop" },
];

function parseDateString(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDayStatus({ lectures, isWeekend, hasEntry }) {
  const presentCount = lectures.filter(
    (lecture) => lecture.status === "present"
  ).length;
  const absentCount = lectures.filter(
    (lecture) => lecture.status === "absent"
  ).length;

  if (lectures.length === 0 && isWeekend) {
    return "holiday";
  }
  if (lectures.length === 0 && hasEntry) {
    return "holiday";
  }
  if (presentCount > 0 && absentCount === 0) {
    return "full";
  }
  if (absentCount > 0 && presentCount === 0) {
    return "absent";
  }
  if (presentCount > 0 && absentCount > 0) {
    return "partial";
  }
  if (isWeekend) {
    return "holiday";
  }
  return "none";
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export default function Calendar() {
  const { currentSemester, addReminder } = useSemester();
  const attendanceData = currentSemester.attendanceData ?? [];
  const reminders = currentSemester.reminders ?? [];
  const [selectedDay, setSelectedDay] = useState(null);
  const [allRemindersOpen, setAllRemindersOpen] = useState(false);
  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const exportRef = useRef(null);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    date: "",
    time: "",
    notifications: ["Mobile"],
  });

  const activeMonthDate = (() => {
    if (!attendanceData.length) return new Date();
    const latestDate = attendanceData.reduce((latest, entry) => {
      const parsed = parseDateString(entry.date);
      if (!parsed) return latest;
      return parsed > latest ? parsed : latest;
    }, new Date(0));
    return latestDate;
  })();

  const monthLabel = formatMonthLabel(activeMonthDate);
  const year = activeMonthDate.getFullYear();
  const monthIndex = activeMonthDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekdayIndex = new Date(year, monthIndex, 1).getDay();

  const subjectsById = new Map(
    (currentSemester.subjects ?? []).map((subject) => [
      subject.id,
      subject,
    ])
  );

  const entriesByDay = new Map();
  attendanceData.forEach((entry) => {
    const parsed = parseDateString(entry.date);
    if (
      parsed &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === monthIndex
    ) {
      entriesByDay.set(parsed.getDate(), entry);
    }
  });

  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date = new Date(year, monthIndex, dayNumber);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dayEntry = entriesByDay.get(dayNumber);
    const lectures = dayEntry?.lectures ?? [];
    const status = getDayStatus({
      lectures,
      isWeekend,
      hasEntry: Boolean(dayEntry),
    });

    return {
      dayNumber,
      status,
      date,
      dayEntry,
      isWeekend,
    };
  });

  const leadingBlanks = Array.from(
    { length: startWeekdayIndex },
    (_, index) => ({
      key: `blank-${index}`,
      empty: true,
    })
  );

  const statusCounts = calendarDays.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    {
      full: 0,
      partial: 0,
      absent: 0,
      holiday: 0,
      none: 0,
    }
  );

  const totalMarkedDays = calendarDays.filter(
    (day) => day.status !== "none"
  ).length;
  const attendedDays = calendarDays.filter((day) =>
    ["full", "partial"].includes(day.status)
  ).length;
  const attendanceThisMonth = totalMarkedDays
    ? Math.round((attendedDays / totalMarkedDays) * 100)
    : 0;

  const entriesThisMonth = attendanceData.filter((entry) => {
    const parsed = parseDateString(entry.date);
    return (
      parsed &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === monthIndex
    );
  });
  const { totalClasses, totalAttended } = entriesThisMonth.reduce(
    (acc, entry) => {
      (entry.lectures ?? []).forEach((lecture) => {
        const status = lecture.status ?? "pending";
        if (["present", "absent", "partial"].includes(status)) {
          acc.totalClasses += 1;
          if (status === "present" || status === "partial") {
            acc.totalAttended += 1;
          }
        }
      });
      return acc;
    },
    { totalClasses: 0, totalAttended: 0 }
  );
  const overallAttendancePct = totalClasses
    ? Math.round((totalAttended / totalClasses) * 100)
    : 0;

  const previousMonthDate = new Date(year, monthIndex - 1, 1);
  const prevYear = previousMonthDate.getFullYear();
  const prevMonth = previousMonthDate.getMonth();
  const prevDays = new Date(prevYear, prevMonth + 1, 0).getDate();
  const prevEntries = attendanceData.filter((entry) => {
    const parsed = parseDateString(entry.date);
    return (
      parsed &&
      parsed.getFullYear() === prevYear &&
      parsed.getMonth() === prevMonth
    );
  });
  let presentDays = 0;
  let markedDays = 0;
  for (let day = 1; day <= prevDays; day += 1) {
    const entry = prevEntries.find((item) => {
      const parsed = parseDateString(item.date);
      return parsed?.getDate() === day;
    });
    if (!entry) continue;
    const present = entry.lectures?.some(
      (lecture) => lecture.status === "present"
    );
    const absent = entry.lectures?.some(
      (lecture) => lecture.status === "absent"
    );
    if (present || absent || entry.lectures?.length === 0) {
      markedDays += 1;
    }
    if (present) presentDays += 1;
  }
  const prevPct = markedDays
    ? Math.round((presentDays / markedDays) * 100)
    : 0;
  const monthOverMonthDelta = attendanceThisMonth - prevPct;
  const prevEntriesByDay = new Map();
  prevEntries.forEach((entry) => {
    const parsed = parseDateString(entry.date);
    if (parsed) {
      prevEntriesByDay.set(parsed.getDate(), entry);
    }
  });
  const previousStatusCounts = {
    full: 0,
    partial: 0,
    absent: 0,
    holiday: 0,
    none: 0,
  };
  for (let day = 1; day <= prevDays; day += 1) {
    const date = new Date(prevYear, prevMonth, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const entry = prevEntriesByDay.get(day);
    const lectures = entry?.lectures ?? [];
    const status = getDayStatus({
      lectures,
      isWeekend,
      hasEntry: Boolean(entry),
    });
    previousStatusCounts[status] += 1;
  }

  const monthlyHighlights = [
    {
      title: "Longest streak",
      value: `${Math.max(0, statusCounts.full)} days`,
      detail: "Based on full-day attendance",
    },
    {
      title: "Perfect weeks",
      value: `${Math.max(0, Math.floor(statusCounts.full / 5))} weeks`,
      detail: "Weeks without absences",
    },
    {
      title: "Attendance this month",
      value: `${attendanceThisMonth}%`,
      detail: `${monthOverMonthDelta >= 0 ? "+" : ""}${monthOverMonthDelta}% vs last month`,
    },
  ];

  const visibleReminders = reminders.slice(0, 3);

  const hasMoreReminders = reminders.length > 3;

  const formatDelta = (delta) =>
    `${delta >= 0 ? "+" : ""}${delta} vs last month`;

  const reminderDateLabel = (dateString) => {
    const parsed = parseDateString(dateString);
    if (!parsed) return dateString;
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  const handleExportMonth = async () => {
    if (!exportRef.current) return;
    const html2canvas = window.html2canvas;
    const jsPDF = window.jspdf?.jsPDF;
    if (!html2canvas || !jsPDF) return;
    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: exportPalette.surface,
    });
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageHeightPx = Math.floor(
      (pageHeight * canvas.width) / pageWidth
    );
    const overlapPx = 2;
    let renderedPages = 0;

    while (renderedPages * pageHeightPx < canvas.height) {
      const sourceY =
        renderedPages === 0
          ? 0
          : renderedPages * pageHeightPx - overlapPx;
      const sliceHeight = Math.min(
        pageHeightPx + (renderedPages === 0 ? 0 : overlapPx),
        canvas.height - sourceY
      );
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const pageContext = pageCanvas.getContext("2d");
      if (!pageContext) return;
      pageContext.fillStyle = exportPalette.surface;
      pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageContext.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );
      const imageData = pageCanvas.toDataURL("image/png");
      if (renderedPages > 0) {
        pdf.addPage();
      }
      pdf.setFillColor(exportPalette.surface);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      const renderedHeight =
        sliceHeight < pageHeightPx
          ? (sliceHeight * pageWidth) / canvas.width
          : pageHeight;
      pdf.addImage(
        imageData,
        "PNG",
        0,
        0,
        pageWidth,
        renderedHeight
      );
      renderedPages += 1;
    }

    const monthNumber = String(monthIndex + 1).padStart(2, "0");
    pdf.save(`attendance-${year}-${monthNumber}.pdf`);
  };

  const handleAddReminder = (event) => {
    event.preventDefault();
    if (!reminderForm.title || !reminderForm.date) return;
    addReminder({
      id: `${Date.now()}`,
      title: reminderForm.title,
      date: reminderForm.date,
      time: reminderForm.time,
      notifications: reminderForm.notifications,
    });
    setReminderForm({
      title: "",
      date: "",
      time: "",
      notifications: ["Mobile"],
    });
    setAddReminderOpen(false);
  };

  const handleNotificationToggle = (channel) => {
    setReminderForm((prev) => {
      const isSelected = prev.notifications.includes(channel);
      const notifications = isSelected
        ? prev.notifications.filter((item) => item !== channel)
        : [...prev.notifications, channel];
      return {
        ...prev,
        notifications: notifications.length
          ? notifications
          : prev.notifications,
      };
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-6">
      <div
        ref={exportRef}
        className="fixed left-[-9999px] top-0 w-[800px] space-y-6 p-6"
        style={{ backgroundColor: exportPalette.surface, color: "#f9fafb" }}
      >
        <div className="space-y-1">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: exportPalette.muted }}
          >
            Attendance Summary
          </p>
          <h2 className="text-2xl font-semibold">{monthLabel}</h2>
        </div>

        <div
          className="rounded-2xl p-4 shadow-sm"
          style={{
            border: `1px solid ${exportPalette.border}`,
            backgroundColor: exportPalette.surface,
          }}
        >
          <div
            className="grid grid-cols-7 gap-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: exportPalette.muted }}
          >
            {weekDays.map((day) => (
              <div key={`export-${day}`} className="text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {leadingBlanks.map((blank) => (
              <div
                key={`export-${blank.key}`}
                className="h-12 rounded-lg"
              />
            ))}
            {calendarDays.map((day) => (
              <div
                key={`export-day-${day.dayNumber}`}
                className="flex flex-col justify-between rounded-lg p-2 text-[11px] font-semibold"
                style={{
                  border: `1px solid ${exportPalette.border}`,
                  backgroundColor:
                    exportPalette[day.status]?.background ??
                    exportPalette.none.background,
                  color:
                    exportPalette[day.status]?.text ?? exportPalette.none.text,
                }}
              >
                <div
                  className="flex items-center justify-between text-[10px]"
                  style={{ color: exportPalette.muted }}
                >
                  <span>{day.dayNumber}</span>
                  <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                </div>
                <p className="text-[9px] font-semibold uppercase tracking-wide">
                  {statusConfig[day.status].label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total attendance",
              value: totalAttended,
            },
            {
              label: "Classes conducted",
              value: totalClasses,
            },
            {
              label: "Overall percentage",
              value: `${overallAttendancePct}%`,
            },
          ].map((item) => (
            <div
              key={`export-summary-${item.label}`}
              className="rounded-2xl p-4 text-center"
              style={{
                border: `1px solid ${exportPalette.border}`,
                backgroundColor: exportPalette.softSurface,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: exportPalette.muted }}
              >
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: exportPalette.muted }}
          >
            Detailed Attendance Log
          </p>
          <div
            className="rounded-2xl p-4"
            style={{
              border: `1px solid ${exportPalette.border}`,
              backgroundColor: exportPalette.softSurface,
            }}
          >
            <div className="space-y-3 text-sm">
              {calendarDays.map((day) => {
                const dateLabel = day.date.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const lectures = day.dayEntry?.lectures ?? [];
                const hasLectures = lectures.length > 0;
                const logLine = hasLectures
                  ? lectures
                      .map((lecture) => {
                        const subject = subjectsById.get(lecture.subjectId);
                        const subjectName = subject?.name ?? lecture.subjectId;
                        const type = lecture.type ?? subject?.type ?? "lecture";
                        const status = lecture.status ?? "pending";
                        return `${subjectName} (${type}) · ${status}`;
                      })
                      .join(", ")
                  : day.dayEntry
                    ? "Holiday · No lectures"
                    : "No entries";
                return (
                  <div
                    key={`export-log-${day.dayNumber}`}
                    className="rounded-xl p-3"
                    style={{
                      border: `1px solid ${exportPalette.border}`,
                      backgroundColor:
                        exportPalette[day.status]?.background ??
                        exportPalette.none.background,
                      color:
                        exportPalette[day.status]?.text ??
                        exportPalette.none.text,
                    }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: exportPalette.muted }}>
                        {dateLabel}
                      </span>
                      <span>{statusConfig[day.status].label}</span>
                    </div>
                    <p className="mt-2 text-xs">{logLine}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Attendance Calendar
          </span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Your attendance, beautifully tracked
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            See full-day, partial, absent, and holiday patterns at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportMonth}
            className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Export Month
          </button>
          <button
            type="button"
            onClick={() => setAddReminderOpen(true)}
            className="rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Add Reminder
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Full days",
            value: statusCounts.full,
            change: formatDelta(
              statusCounts.full - previousStatusCounts.full
            ),
            status: "full",
          },
          {
            title: "Partial days",
            value: statusCounts.partial,
            change: formatDelta(
              statusCounts.partial - previousStatusCounts.partial
            ),
            status: "partial",
          },
          {
            title: "Absences",
            value: statusCounts.absent,
            change: formatDelta(
              statusCounts.absent - previousStatusCounts.absent
            ),
            status: "absent",
          },
          {
            title: "Holidays",
            value: statusCounts.holiday,
            change: formatDelta(
              statusCounts.holiday - previousStatusCounts.holiday
            ),
            status: "holiday",
          },
        ].map((item, index) => (
          <div
            key={item.title}
            className={`animate-[fadeUp_0.6s_ease-out] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 p-4 shadow-sm`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.title}
              </p>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  statusConfig[item.status].badge
                }`}
              >
                {statusConfig[item.status].label}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {item.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.change}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2.1fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Calendar View
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {monthLabel}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig)
                .filter(([key]) => key !== "none")
                .map(([key, config]) => (
                  <span
                    key={key}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}
                  >
                    {config.label}
                  </span>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {weekDays.map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-800/60 p-2">
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {leadingBlanks.map((blank) => (
              <div
                key={blank.key}
                className="h-12 sm:h-14 rounded-lg border border-transparent"
              />
            ))}
            {calendarDays.map((day, index) => (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() =>
                  setSelectedDay({
                    day: day.dayNumber,
                    status: day.status,
                    date: day.date,
                    dayEntry: day.dayEntry,
                  })
                }
                className={`group h-12 sm:h-14 rounded-lg border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900 p-2 text-[11px] sm:text-sm font-semibold transition ${
                  statusConfig[day.status].tile
                } hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg dark:hover:border-gray-600`}
                style={{
                  animation: "fadeUp 0.5s ease-out",
                  animationDelay: `${(index % 7) * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  <span>{day.dayNumber}</span>
                  <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                </div>
                <p className="mt-3 sm:mt-4 text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide">
                  {statusConfig[day.status].label}
                </p>
              </button>
            ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Highlights
            </h3>
            <div className="mt-4 space-y-3">
              {monthlyHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {item.title}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reminders
              </h3>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-300">
                {reminders.length} items
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {visibleReminders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                  No reminders yet. Add one to get notified.
                </div>
              ) : (
                visibleReminders.map((note) => (
                <div
                  key={note.id ?? note.title}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reminderDateLabel(note.date)}{" "}
                      {note.time ? `· ${note.time}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Notifications: {note.notifications?.join(", ") || "None"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(note.notifications || []).map((channel) => (
                      <span
                        key={`${note.id ?? note.title}-${channel}`}
                        className="rounded-full bg-white dark:bg-gray-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              ))
              )}
            </div>
            {hasMoreReminders && (
              <button
                type="button"
                onClick={() => setAllRemindersOpen(true)}
                className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                View more
              </button>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={allRemindersOpen}
        onClose={() => setAllRemindersOpen(false)}
        size="lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Reminders
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Every reminder with notification channels
            </p>
          </div>
        </div>

        <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {reminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              No reminders yet.
            </div>
          ) : (
            reminders.map((note) => (
              <div
                key={`all-${note.id ?? note.title}`}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reminderDateLabel(note.date)}{" "}
                      {note.time ? `· ${note.time}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Notifications: {note.notifications?.join(", ") || "None"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(note.notifications || []).map((channel) => (
                      <span
                        key={`all-${note.id ?? note.title}-${channel}`}
                        className="rounded-full bg-white dark:bg-gray-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        open={addReminderOpen}
        onClose={() => setAddReminderOpen(false)}
        size="lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add Reminder
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Schedule a reminder and pick your notification channels.
            </p>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleAddReminder}>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={reminderForm.title}
              onChange={(event) =>
                setReminderForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Weekly lab reminder"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                value={reminderForm.date}
                onChange={(event) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time
              </label>
              <input
                type="time"
                value={reminderForm.time}
                onChange={(event) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    time: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notifications
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {notificationOptions.map((option) => {
                const isSelected = reminderForm.notifications.includes(
                  option.value
                );
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      isSelected
                        ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                        : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleNotificationToggle(option.value)}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddReminderOpen(false)}
              className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
            >
              Save Reminder
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        size="lg"
      >
        {selectedDay && (
          <>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {selectedDay.date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Attendance details for the day
            </p>
          </div>
          {selectedDay.status && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusConfig[selectedDay.status]?.badge
              }`}
            >
              {statusConfig[selectedDay.status]?.label}
            </span>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {selectedDay.dayEntry?.lectures?.length ? (
            selectedDay.dayEntry.lectures.map((lecture, index) => {
              const subject = subjectsById.get(lecture.subjectId);
              const statusLabel = lecture.status || "pending";
              return (
              <div
                key={`${selectedDay.day}-${lecture.subjectId}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {subject?.name ?? lecture.subjectId}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lecture.type ?? subject?.type ?? "lecture"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    lectureStatusStyles[statusLabel] ||
                    lectureStatusStyles.pending
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              {selectedDay.status === "holiday"
                ? "Holiday · No lectures"
                : "No lectures recorded for this day."}
            </div>
          )}
        </div>
        </>
        )}
      </Modal>
    </div>
  );
}