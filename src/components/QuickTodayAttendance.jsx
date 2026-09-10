// src/components/QuickTodayAttendance.jsx
import { useState } from "react";
import Modal from "./Modal";
import DayLecturesEditor from "./DayLecturesEditor";
import { useSemester } from "../context/SemesterContext";
import { getTodayDate } from "../store/attendanceStore";
import { getLecturesForDate } from "../utils/timetableUtils";

const ACTIONS = ["present", "absent", "free", "cancelled"];

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
  const { currentSemester, markTodayAttendance, updateDayLectures, resetDayLecturesToDefault, markDayStatus } = useSemester();
  const [isEditing, setIsEditing] = useState(false);
  const today = getTodayDate();

  const todayEntry = currentSemester.attendanceData.find(
    (day) => day.date === today
  );
  const timetableLectures = getLecturesForDate(today, currentSemester);
  const isCustom = Boolean(todayEntry?.isCustomSchedule);
  const isHoliday = todayEntry?.dayType === "holiday";

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

  const subjectsById = new Map(
    currentSemester.subjects.map((subject) => [
      subject.id,
      subject,
    ])
  );

  function getStatus(lecture) {
    return todayData.lectures.find(
      (l) => l.subjectId === lecture.subjectId && (l.slotIndex ?? 0) === (lecture.slotIndex ?? 0)
    )?.status;
  }

  // If no lectures are scheduled and not editing, show a friendly prompt with "+ Add Classes"
  if (!todayData.lectures.length && !isEditing) {
    return (
      <Modal open={open} onClose={onClose} size="md">
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto text-2xl">
            {isHoliday ? "🏖️" : "📅"}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {isHoliday ? "Today is marked as a Holiday" : "No lectures scheduled for today"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              {isHoliday
                ? "This day has been designated as a holiday in your calendar. You can resume regular classes or add custom lectures."
                : "Your standard timetable has no classes today. If your timetable changed or extra classes were held, you can add them for today only."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {isHoliday && (
              <button
                type="button"
                onClick={() => markDayStatus(today, null)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 cursor-pointer transition active:scale-95"
              >
                Resume Regular Schedule
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition active:scale-95"
            >
              + Add Lectures For Today
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      size="md"
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Edit Today’s Lectures
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Customize classes for today only.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              ✕
            </button>
          </div>

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
      ) : (
        <>
          {/* Header with Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Mark Today’s Attendance
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Mark your presence or select lecture status below.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {isHoliday && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 whitespace-nowrap shrink-0">
                    <span>🏖️</span> Holiday
                  </span>
                )}
                {isCustom && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0">
                    <span>✨</span> Custom Schedule
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              {isHoliday ? (
                <button
                  type="button"
                  onClick={() => markDayStatus(today, null)}
                  className="px-2.5 py-1.5 rounded-xl border border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-xs font-bold text-sky-700 dark:text-sky-300 shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95 shrink-0 whitespace-nowrap"
                  title="Resume regular classes for today"
                >
                  <span>▶️</span>
                  <span>Resume Classes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => markDayStatus(today, "holiday")}
                  className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95 shrink-0 whitespace-nowrap"
                  title="Mark today as a holiday"
                >
                  <span>🏖️</span>
                  <span>Mark Holiday</span>
                </button>
              )}

              {/* Edit 1-Day Timetable Button */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95 shrink-0 whitespace-nowrap"
                title="Edit lectures for today only if timetable changed"
              >
                <span>✏️</span>
                <span>Edit Lectures</span>
              </button>
            </div>
          </div>

          {/* Holiday Alert Banner */}
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

          {/* Clean Lecture Cards Container - NO NESTED SCROLLBAR */}
          <div className="space-y-3">
            {todayData.lectures.map((lecture) => {
              const subject = subjectsById.get(lecture.subjectId);
              if (!subject) return null;
              const status = getStatus(lecture);
              const uniqueKey = `${today}-${lecture.subjectId}-${lecture.slotIndex ?? 0}`;

              return (
                <div
                  key={uniqueKey}
                  className="rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {subject.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                        {lecture.type || subject.type || "lecture"}
                      </p>
                    </div>
                    {status && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${statusPillStyles[String(status).toLowerCase()] || statusPillStyles.pending}`}>
                        {status}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ACTIONS.map((action) => {
                      const style = optionStyles[action];
                      const isSelected = status === action;
                      return (
                        <button
                          key={action}
                          type="button"
                          onClick={() => markTodayAttendance(subject.id, action, lecture.slotIndex)}
                          className={`
                            px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition duration-200 cursor-pointer text-center
                            border ${isSelected ? style.selected : style.unselected}
                            active:scale-95
                          `}
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
        </>
      )}
    </Modal>
  );
}
