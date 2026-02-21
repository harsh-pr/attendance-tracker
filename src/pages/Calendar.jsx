import Modal from "../components/Modal";
import { useSemester } from "../context/SemesterContext";
import { useEffect, useRef, useState } from "react";
import { getLecturesForDate } from "../utils/timetableUtils";

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
  exam: {
    label: "Exam Day",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    tile:
      "bg-violet-50/80 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100",
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
  exam: { background: "#2b1b3f", text: "#e9d5ff" },
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

function parseDateString(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDayStatus({ lectures, isWeekend, hasEntry, dayType }) {
  if (dayType === "exam") {
    return "exam";
  }
  if (dayType === "holiday") {
    return "holiday";
  }
  const presentCount = lectures.filter(
    (lecture) =>
      lecture.status === "present" || lecture.status === "free"
  ).length;
  const absentCount = lectures.filter(
    (lecture) => lecture.status === "absent"
  ).length;
  const cancelledCount = lectures.filter(
    (lecture) => lecture.status === "cancelled"
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
  if (lectures.length > 0 && cancelledCount === lectures.length) {
    return "holiday";
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
function buildReminderTriggerTime(dateString, timeString) {
  if (!dateString) return null;
  const timeValue = timeString || "00:00";
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (!year || !month || !day) return null;
  return new Date(
    year,
    month - 1,
    day,
    Number.isNaN(hours) ? 0 : hours,
    Number.isNaN(minutes) ? 0 : minutes
  );
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
    removeDayAttendance,
  } = useSemester();
  const attendanceData = currentSemester.attendanceData ?? [];
  const reminders = currentSemester.reminders ?? [];
  const [selectedDay, setSelectedDay] = useState(null);
  const [allRemindersOpen, setAllRemindersOpen] = useState(false);
  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [partialMarkOpen, setPartialMarkOpen] = useState(false);
  const [partialSelection, setPartialSelection] = useState({});
  const exportRef = useRef(null);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    date: "",
    time: "",
  });

  const initialMonthDate = (() => {
    if (!attendanceData.length) return new Date();
    const latestDate = attendanceData.reduce((latest, entry) => {
      const parsed = parseDateString(entry.date);
      if (!parsed) return latest;
      return parsed > latest ? parsed : latest;
    }, new Date(0));
    return latestDate;
  })();

  const [activeMonthDate, setActiveMonthDate] = useState(
    new Date(initialMonthDate.getFullYear(), initialMonthDate.getMonth(), 1)
  );

  useEffect(() => {
    setActiveMonthDate(
      new Date(initialMonthDate.getFullYear(), initialMonthDate.getMonth(), 1)
    );
  }, [currentSemester.id]);

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
      dayType: dayEntry?.dayType,
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
      exam: 0,
      none: 0,
    }
  );

  const totalMarkedDays = calendarDays.filter(
    (day) => day.status !== "none"
  ).length;
  const attendedDays = calendarDays.filter((day) =>
    ["full", "partial", "exam"].includes(day.status)
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
    exam: 0,
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
      dayType: entry?.dayType,
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
    ensureNotificationPermission();
    const triggerAt = buildReminderTriggerTime(
      reminderForm.date,
      reminderForm.time
    );
    if (editingReminder) {
      const updates = {
        title: reminderForm.title,
        date: reminderForm.date,
        time: reminderForm.time,
        triggerAt: triggerAt?.toISOString() ?? null,
        delivered: false,
      };
      updateReminder(editingReminder.id, updates);
    } else {
      const reminder = {
        id: `${Date.now()}`,
        title: reminderForm.title,
        date: reminderForm.date,
        time: reminderForm.time,
        triggerAt: triggerAt?.toISOString() ?? null,
        delivered: false,
      };
      addReminder(reminder);
    }
    handleCloseReminderModal();
  };

  const ensureNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    return Notification.requestPermission();
  };

  const scheduleReminderNotification = (reminder) => {
    const triggerTime = reminder.triggerAt
      ? new Date(reminder.triggerAt)
      : buildReminderTriggerTime(reminder.date, reminder.time);
    if (!triggerTime || Number.isNaN(triggerTime.getTime())) return;
    const delay = Math.max(triggerTime.getTime() - Date.now(), 0);

    return window.setTimeout(async () => {
      const permission = await ensureNotificationPermission();
      if (permission === "granted") {
        const body = `Reminder for ${reminder.date}${
          reminder.time ? ` at ${reminder.time}` : ""
        }`;

        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await registration.showNotification(reminder.title, {
                body,
                tag: `reminder-${reminder.id}`,
                renotify: true,
              });
            } else {
              new Notification(reminder.title, { body });
            }
          } catch (error) {
            console.error("Mobile notification failed.", error);
            new Notification(reminder.title, { body });
          }
        } else {
          new Notification(reminder.title, { body });
        }
      } else {
        window.alert(
          `Reminder: ${reminder.title}\n${reminder.date}${
            reminder.time ? ` at ${reminder.time}` : ""
          }`
        );
      }

      removeReminder(reminder.id);
    }, delay);
  };

  const handleCloseReminderModal = () => {
    setReminderForm({
      title: "",
      date: "",
      time: "",
    });
    setEditingReminder(null);
    setAddReminderOpen(false);
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setReminderForm({
      title: reminder.title ?? "",
      date: reminder.date ?? "",
      time: reminder.time ?? "",
    });
    setAddReminderOpen(true);
  };

  const handleDeleteReminder = (reminderId) => {
    if (!reminderId) return;
    removeReminder(reminderId);

    if (editingReminder?.id === reminderId) {
      handleCloseReminderModal();
    }
  };

  const handleDayStatusUpdate = (status) => {
    if (!selectedDay?.date) return;
    const date = formatDateKey(selectedDay.date);
    markDayStatus(date, status);
    setSelectedDay((prev) =>
      prev
        ? {
            ...prev,
            status: status === "present" ? "full" : status,
          }
        : prev
    );
    setEditDayOpen(false);
  };

  const handlePartialAttendanceSave = () => {
    if (!selectedDay?.date) return;
    const date = formatDateKey(selectedDay.date);
    markDayLectureStatuses(date, partialSelection);

    const values = Object.values(partialSelection);
    const attendedCount = values.filter(
      (status) => status === "present" || status === "free"
    ).length;
    const absentCount = values.filter((status) => status === "absent").length;

    setSelectedDay((prev) =>
      prev
        ? {
            ...prev,
            status:
              attendedCount === 0 && absentCount > 0
                ? "absent"
                : absentCount === 0 && attendedCount > 0
                  ? "full"
                  : "partial",
          }
        : prev
    );
    setPartialMarkOpen(false);
    setEditDayOpen(false);
  };

  const setPartialStatus = (subjectId, status) => {
    setPartialSelection((prev) => ({
      ...prev,
      [subjectId]: status,
    }));
  };

  const selectedDayDateKey = selectedDay?.date
    ? formatDateKey(selectedDay.date)
    : null;
  const timetableLectures = selectedDayDateKey
    ? getLecturesForDate(selectedDayDateKey, currentSemester)
    : [];
  const selectedDayLectures = selectedDay?.dayEntry?.lectures?.length
    ? selectedDay.dayEntry.lectures
    : timetableLectures.map((lecture) => ({
        ...lecture,
        status: null,
      }));

  useEffect(() => {
    const timeouts = reminders
      .filter((reminder) => !reminder.delivered)
      .map((reminder) => scheduleReminderNotification(reminder));

    return () => {
      timeouts.forEach((timeoutId) => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      });
    };
  }, [reminders, removeReminder]);

  useEffect(() => {
    if (!selectedDay?.date) return;
    const dateKey = formatDateKey(selectedDay.date);
    const liveEntry = attendanceData.find((day) => day.date === dateKey);
    const isWeekend =
      selectedDay.date.getDay() === 0 || selectedDay.date.getDay() === 6;
    const liveStatus = getDayStatus({
      lectures: liveEntry?.lectures ?? [],
      isWeekend,
      hasEntry: Boolean(liveEntry),
      dayType: liveEntry?.dayType,
    });

    setSelectedDay((prev) =>
      prev
        ? {
            ...prev,
            dayEntry: liveEntry,
            status: liveStatus,
          }
        : prev
    );
  }, [attendanceData, selectedDay?.date]);

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
            onClick={() => {
              setEditingReminder(null);
              setReminderForm({
                title: "",
                date: "",
                time: "",
              });
              setAddReminderOpen(true);
            }}
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
          <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Calendar View
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {monthLabel}
              </h2>
            </div>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() =>
                  setActiveMonthDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
                aria-label="Previous month"
                className="text-3xl leading-none text-gray-600 transition hover:scale-110 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveMonthDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
                aria-label="Next month"
                className="text-3xl leading-none text-gray-600 transition hover:scale-110 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                →
              </button>
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

          <div className="flex justify-end pt-1">
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
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditReminder(note)}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:border-gray-300 hover:text-gray-900 dark:hover:border-gray-500 dark:hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(note.id)}
                      className="rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-200"
                    >
                      Delete
                    </button>
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
              Every reminder you have scheduled
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
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditReminder(note)}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:border-gray-300 hover:text-gray-900 dark:hover:border-gray-500 dark:hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(note.id)}
                      className="rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-200"
                    >
                      Delete
                    </button>              
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        open={addReminderOpen}
        onClose={handleCloseReminderModal}
        size="lg"
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {editingReminder ? "Edit Reminder" : "Add Reminder"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Schedule a reminder for this device.
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseReminderModal} 
              className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            {editingReminder && (
              <button
                type="button"
                onClick={() => handleDeleteReminder(editingReminder.id)}
                className="rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-200"
              >
                Delete Reminder
              </button>
            )}
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
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditDayOpen(true)}
            className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
          >
            Mark / Edit Day
          </button>
        </div>
        </>
        )}
      </Modal>

      <Modal
        open={editDayOpen}
        onClose={() => setEditDayOpen(false)}
        size="md"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Mark attendance for selected date
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose full-day status or open partial presentee marking.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDayStatusUpdate("present")}
            className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200"
          >
            Full Present
          </button>
          <button
            type="button"
            onClick={() => handleDayStatusUpdate("absent")}
            className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-700 dark:text-rose-200"
          >
            Full Absent
          </button>
          <button
            type="button"
            onClick={() => handleDayStatusUpdate("holiday")}
            className="rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-700 dark:text-sky-200"
          >
            Holiday
          </button>
          <button
            type="button"
            onClick={() => handleDayStatusUpdate("exam")}
            className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-700 dark:text-violet-200"
          >
            Exam Day
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setPartialSelection(
              selectedDayLectures.reduce((acc, lecture) => {
                acc[lecture.subjectId] = lecture.status ?? "absent";
                return acc;
              }, {})
            );
            setPartialMarkOpen(true);
          }}
          className="mt-4 w-full rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-200"
        >
          Partial Presentee Marking
        </button>
        <button
          type="button"
          onClick={() => {
            if (!selectedDay?.date) return;
            removeDayAttendance(formatDateKey(selectedDay.date));
            setEditDayOpen(false);
            setSelectedDay(null);
          }}
          className="mt-2 w-full rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-700 dark:text-rose-200"
        >
          Remove Attendance Data For This Day
        </button>
      </Modal>

      <Modal
        open={partialMarkOpen}
        onClose={() => setPartialMarkOpen(false)}
        size="md"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Mark subject-wise status
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pick Present, Absent, Free, or Cancelled for each lecture.
        </p>
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {selectedDayLectures.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-3 text-sm text-gray-500 dark:text-gray-400">
              No lectures found for this day.
            </div>
          ) : (
            selectedDayLectures.map((lecture) => {
              const subject = subjectsById.get(lecture.subjectId);
              const currentStatus =
                partialSelection[lecture.subjectId] ?? "absent";
              return (
                <div
                  key={`partial-${lecture.subjectId}`}
                  className="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3"
                >
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {subject?.name ?? lecture.subjectId}
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      {
                        value: "present",
                        label: "Present",
                        className:
                          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
                      },
                      {
                        value: "absent",
                        label: "Absent",
                        className:
                          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
                      },
                      {
                        value: "free",
                        label: "Free",
                        className:
                          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
                      },
                      {
                        value: "cancelled",
                        label: "Cancelled",
                        className:
                          "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
                      },
                    ].map((option) => {
                      const active = currentStatus === option.value;
                      return (
                        <button
                          key={`${lecture.subjectId}-${option.value}`}
                          type="button"
                          onClick={() =>
                            setPartialStatus(lecture.subjectId, option.value)
                          }
                          className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                            active
                              ? `${option.className} ring-2 ring-offset-1 ring-gray-300 dark:ring-gray-500`
                              : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPartialMarkOpen(false)}
            className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePartialAttendanceSave}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
          >
            Save Partial Marking
          </button>
        </div>
      </Modal>
    </div>
  );
}