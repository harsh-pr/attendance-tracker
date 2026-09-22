// src/components/QuickTodayAttendance.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import DayLecturesEditor from "./DayLecturesEditor";
import { useSemester } from "../context/SemesterContext";
import { getTodayDate } from "../store/attendanceStore";
import { getLecturesForDate } from "../utils/timetableUtils";

const ACTIONS = ["present", "absent", "free", "cancelled"];

const optionStyles = {
  present: {
    label: "Present",
    selected: "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-300/60 dark:hover:border-emerald-500/20 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5 font-semibold",
  },
  absent: {
    label: "Absent",
    selected: "border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 font-bold",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-rose-300/60 dark:hover:border-rose-500/20 hover:bg-rose-50/20 dark:hover:bg-rose-500/5 font-semibold",
  },
  free: {
    label: "Free",
    selected: "border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20 font-bold",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-sky-300/60 dark:hover:border-sky-500/20 hover:bg-sky-50/20 dark:hover:bg-sky-500/5 font-semibold",
  },
  cancelled: {
    label: "Cancelled",
    selected: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 ring-2 ring-zinc-500/20 font-bold",
    unselected: "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 font-semibold",
  },
};

const statusPillStyles = {
  present: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  absent: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
  free: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
  cancelled: "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
  holiday: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
  exam: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
  pending: "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800",
};

export default function QuickTodayAttendance({ open, onClose }) {
  const {
    currentSemester,
    markTodayAttendance,
    updateDayLectures,
    resetDayLecturesToDefault,
    markDayStatus,
    removeDayAttendance,
  } = useSemester();

  const [isEditing, setIsEditing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));

  const today = getTodayDate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Lock background body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle ESC key to dismiss drawer or modal
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isEditing, onClose]);

  const todayEntry = currentSemester.attendanceData.find((day) => day.date === today);
  const timetableLectures = getLecturesForDate(today, currentSemester);
  const isCustom = Boolean(todayEntry?.isCustomSchedule);
  const isHoliday = todayEntry?.dayType === "holiday";
  const isExam = todayEntry?.dayType === "exam";

  const lectureKey = (l) => (l.slotIndex != null ? `${l.subjectId}::${l.slotIndex}` : l.subjectId);

  const statusByLectureKey = new Map(
    (todayEntry?.lectures || []).map((lecture, idx) => [
      lectureKey({ ...lecture, slotIndex: lecture.slotIndex ?? idx }),
      lecture.status,
    ])
  );

  let baseLectures = [];
  if (isCustom && todayEntry?.lectures && todayEntry.lectures.length > 0) {
    baseLectures = todayEntry.lectures;
  } else if (timetableLectures.length > 0) {
    baseLectures = timetableLectures.map((l, idx) => ({
      ...l,
      slotIndex: l.slotIndex ?? idx,
      status: statusByLectureKey.get(lectureKey({ ...l, slotIndex: l.slotIndex ?? idx })) ?? l.status ?? null,
    }));
  } else if (todayEntry?.lectures && todayEntry.lectures.length > 0) {
    baseLectures = todayEntry.lectures;
  }

  const todayData = {
    date: today,
    lectures: baseLectures.map((lecture, idx) => ({
      ...lecture,
      slotIndex: lecture.slotIndex ?? idx,
      status: lecture.status ?? statusByLectureKey.get(lectureKey({ ...lecture, slotIndex: lecture.slotIndex ?? idx })) ?? null,
    })),
  };

  const subjectsById = new Map(currentSemester.subjects.map((subject) => [subject.id, subject]));

  function getStatus(lecture) {
    return todayData.lectures.find(
      (l) => l.subjectId === lecture.subjectId && (l.slotIndex ?? 0) === (lecture.slotIndex ?? 0)
    )?.status;
  }

  const isFullPresent =
    !isHoliday &&
    !isExam &&
    todayData.lectures.length > 0 &&
    todayData.lectures.every((l) => l.status === "present");

  const isFullAbsent =
    !isHoliday &&
    !isExam &&
    todayData.lectures.length > 0 &&
    todayData.lectures.every((l) => l.status === "absent");

  const todayDateObj = new Date(today + "T00:00:00");
  const formattedToday = todayDateObj.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="quick-today-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          onClick={() => {
            setIsEditing(false);
            onClose();
          }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm overflow-hidden"
        >
          <motion.div
            key="quick-today-modal-card"
            onClick={(e) => e.stopPropagation()}
            drag={isEditing ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            dragSnapToOrigin={true}
            onDragEnd={(e, info) => {
              if (!isEditing && (info.offset.y > 100 || info.velocity.y > 250)) {
                setIsEditing(false);
                onClose();
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
              isEditing ? "max-w-[1240px]" : "max-w-2xl sm:max-w-3xl"
            } rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0c0d12] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800/90 shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh] sm:max-h-[88vh] transition-[max-width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]`}
          >
            {/* Kokonut-style drag handle bar */}
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700/80 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Content sections with divider in between */}
            <div className="flex flex-col lg:flex-row items-stretch flex-1 min-h-[420px] overflow-y-auto lg:overflow-hidden no-scrollbar">
              {/* SECTION 1: Main Today View (Header, Quick Buttons, Subject-Wise Cards) */}
              <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto no-scrollbar">
                <div>
                  {/* Header with Title and Edit Lectures Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[Poppins] tracking-tight">
                          Mark Today’s Attendance
                        </h2>
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
                          {formattedToday}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Quickly mark full day or select individual lecture status below.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {isHoliday && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 whitespace-nowrap shrink-0">
                            <span>🏖️</span> Holiday
                          </span>
                        )}
                        {isExam && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 whitespace-nowrap shrink-0">
                            <span>📝</span> Exam Day
                          </span>
                        )}
                        {isCustom && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0">
                            <span>✨</span> Custom Schedule
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Edit Lectures Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsEditing((prev) => !prev)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 shrink-0 self-start sm:self-center ${
                        isEditing
                          ? "border-blue-400 bg-blue-100/80 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400/40"
                          : "border-blue-200/80 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 text-blue-800 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-500/10"
                      }`}
                      title="Edit lectures for today only"
                    >
                      <div className="rounded-lg p-1 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="leading-tight">{isEditing ? "Editing Lectures →" : "Edit Lectures"}</div>
                        <div className="text-[10px] opacity-80 leading-tight">
                          {isEditing ? "Click to close" : "Change today's slots"}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* QUICK FULL DAY STATUS BUTTONS */}
                  <div className="mt-3.5 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Quick Full Day Status
                    </span>
                    <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Full Present */}
                      <button
                        type="button"
                        onClick={() => markDayStatus(today, "present")}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 ${
                          isFullPresent
                            ? "border-emerald-400 bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/40"
                            : "border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/10"
                        }`}
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

                      {/* Full Absent */}
                      <button
                        type="button"
                        onClick={() => markDayStatus(today, "absent")}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 ${
                          isFullAbsent
                            ? "border-rose-400 bg-rose-100/80 dark:bg-rose-500/20 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400/40"
                            : "border-rose-200/80 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 text-rose-800 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-500/10"
                        }`}
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

                      {/* Holiday */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isHoliday) {
                            markDayStatus(today, null);
                          } else {
                            markDayStatus(today, "holiday");
                          }
                        }}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 ${
                          isHoliday
                            ? "border-sky-400 bg-sky-100/80 dark:bg-sky-500/20 text-sky-900 dark:text-sky-200 ring-2 ring-sky-400/40"
                            : "border-sky-200/80 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-500/5 text-sky-800 dark:text-sky-300 hover:bg-sky-100/60 dark:hover:bg-sky-500/10"
                        }`}
                      >
                        <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs leading-tight truncate">
                            {isHoliday ? "Holiday (Active)" : "Holiday"}
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">
                            {isHoliday ? "Click to resume" : "No classes held"}
                          </div>
                        </div>
                      </button>

                      {/* Exam Day */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isExam) {
                            markDayStatus(today, null);
                          } else {
                            markDayStatus(today, "exam");
                          }
                        }}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 ${
                          isExam
                            ? "border-violet-400 bg-violet-100/80 dark:bg-violet-500/20 text-violet-900 dark:text-violet-200 ring-2 ring-violet-400/40"
                            : "border-violet-200/80 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 text-violet-800 dark:text-violet-300 hover:bg-violet-100/60 dark:hover:bg-violet-500/10"
                        }`}
                      >
                        <div className="rounded-lg p-1.5 bg-white/80 dark:bg-zinc-800 shadow-xs flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs leading-tight truncate">
                            {isExam ? "Exam Day (Active)" : "Exam Day"}
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">
                            {isExam ? "Click to resume" : "Exam conducted"}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Holiday / Exam Alert Banner */}
                  {isHoliday && (
                    <div className="mb-3.5 rounded-2xl p-3 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">🏖️</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-sky-900 dark:text-sky-200 truncate">
                            Today is marked as a Holiday in your calendar
                          </p>
                          <p className="text-[11px] text-sky-700 dark:text-sky-400 truncate">
                            Marking any lecture below or clicking Resume will clear the holiday status.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => markDayStatus(today, null)}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        Resume
                      </button>
                    </div>
                  )}

                  {isExam && (
                    <div className="mb-3.5 rounded-2xl p-3 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">📝</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">
                            Today is marked as an Exam Day
                          </p>
                          <p className="text-[11px] text-purple-700 dark:text-purple-400 truncate">
                            Regular classes are paused. Click Resume or any lecture status to reactivate schedule.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => markDayStatus(today, null)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        Resume
                      </button>
                    </div>
                  )}

                  {/* Subject-Wise Lecture Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Subject-Wise Attendance ({todayData.lectures.length} {todayData.lectures.length === 1 ? "lecture" : "lectures"})
                      </span>
                    </div>

                    {todayData.lectures.length === 0 ? (
                      <div className="p-6 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs space-y-2.5">
                        <p className="font-medium text-zinc-600 dark:text-zinc-400">
                          {isHoliday
                            ? "Holiday · No lectures scheduled"
                            : isExam
                            ? "Exam Day · No lectures scheduled"
                            : "No lectures scheduled for today in your standard timetable."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition active:scale-95"
                        >
                          <span>+</span>
                          <span>Add Lectures For Today</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {todayData.lectures.map((lecture) => {
                          const subject = subjectsById.get(lecture.subjectId);
                          if (!subject) return null;
                          const status = getStatus(lecture);
                          const uniqueKey = `${today}-${lecture.subjectId}-${lecture.slotIndex ?? 0}`;

                          return (
                            <div
                              key={uniqueKey}
                              className="rounded-2xl p-3.5 border border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 space-y-2.5 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                    {subject.name}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                                    {lecture.type || subject.type || "lecture"}
                                  </p>
                                </div>
                                {status && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs shrink-0 ${
                                      statusPillStyles[String(status).toLowerCase()] || statusPillStyles.pending
                                    }`}
                                  >
                                    {status}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                                {ACTIONS.map((action) => {
                                  const style = optionStyles[action];
                                  const isSelected = status === action;
                                  return (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={() => markTodayAttendance(subject.id, action, lecture.slotIndex)}
                                      className={`px-2 py-1.5 rounded-xl text-xs capitalize transition duration-150 cursor-pointer text-center border ${
                                        isSelected ? style.selected : style.unselected
                                      } active:scale-95`}
                                    >
                                      {style.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Clear Attendance Data Action */}
                {todayEntry && (
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => removeDayAttendance(today)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5 py-1.5 px-3 text-center text-rose-600 dark:text-rose-400 transition hover:bg-rose-100/50 dark:hover:bg-rose-500/10 cursor-pointer active:scale-95 font-bold text-xs uppercase tracking-wider"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear Today&apos;s Attendance Data</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: Expandable Side Drawer on Desktop / Bottom Sheet Overlay on Mobile */}
              <AnimatePresence initial={false}>
                {isEditing && (
                  <motion.div
                    key="today-section-edit-drawer"
                    initial={isDesktop ? { width: 0, opacity: 0 } : { y: "100%" }}
                    animate={isDesktop ? { width: 480, opacity: 1 } : { y: 0 }}
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
                    <div className="w-full lg:w-[480px] p-4 sm:p-5 flex flex-col justify-between h-full overflow-hidden">
                      {/* Top Drag Handle for Mobile View */}
                      <div className="lg:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[Poppins]">
                            Edit Today&apos;s Lectures
                          </h3>
                          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                            Customize schedule for Today only ({formattedToday})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          title="Close Edit Schedule"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Middle: Day Lectures Editor */}
                      <div className="flex-1 min-h-0 py-3 lg:my-auto lg:max-h-[56vh] overflow-y-auto pr-1.5 no-scrollbar">
                        <DayLecturesEditor
                          date={today}
                          initialLectures={todayData.lectures}
                          subjects={currentSemester.subjects}
                          isCustom={isCustom}
                          dateLabel="Today"
                          onSave={(newLectures) => {
                            updateDayLectures(today, newLectures);
                            setIsEditing(false);
                          }}
                          onCancel={() => setIsEditing(false)}
                          onResetToDefault={() => {
                            resetDayLecturesToDefault(today);
                            setIsEditing(false);
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SINGLE COMMON MODAL FOOTER */}
            <div className="border-t border-zinc-200 dark:border-zinc-800/80 px-6 py-3 flex items-center justify-between shrink-0 bg-zinc-50/70 dark:bg-[#0a0b0f]/70">
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                {isEditing
                  ? "Customize today's schedule and click Save & Apply"
                  : "Quickly mark status above or pick individual lecture attendance"}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  onClose();
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
  );
}
