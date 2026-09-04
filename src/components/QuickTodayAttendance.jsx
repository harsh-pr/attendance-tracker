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
    unselected: "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300/60 dark:hover:border-emerald-500/20 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5"
  },
  absent: {
    label: "Absent",
    selected: "border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20",
    unselected: "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-rose-300/60 dark:hover:border-rose-500/20 hover:bg-rose-50/20 dark:hover:bg-rose-500/5"
  },
  free: {
    label: "Free",
    selected: "border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20",
    unselected: "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-sky-300/60 dark:hover:border-sky-500/20 hover:bg-sky-50/20 dark:hover:bg-sky-500/5"
  },
  cancelled: {
    label: "Cancelled",
    selected: "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-2 ring-gray-500/20",
    unselected: "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/30"
  }
};

export default function QuickTodayAttendance({ open, onClose }) {
  const { currentSemester, markTodayAttendance, updateDayLectures, resetDayLecturesToDefault } = useSemester();
  const [isEditing, setIsEditing] = useState(false);
  const today = getTodayDate();

  const todayEntry = currentSemester.attendanceData.find(
    (day) => day.date === today
  );
  const timetableLectures = getLecturesForDate(today, currentSemester);
  const isCustom = Boolean(todayEntry?.isCustomSchedule);

  const lectureKey = (l) => (l.slotIndex != null ? `${l.subjectId}::${l.slotIndex}` : l.subjectId);

  // If todayEntry already has lectures (custom timetable or saved attendance), use them!
  // Otherwise use timetableLectures
  const baseLectures =
    todayEntry?.lectures && todayEntry.lectures.length > 0
      ? todayEntry.lectures
      : timetableLectures.map((l, idx) => ({ ...l, slotIndex: idx, status: null }));

  const statusByLectureKey = new Map(
    (todayEntry?.lectures || []).map((lecture) => [
      lectureKey(lecture),
      lecture.status,
    ])
  );

  const todayData = {
    date: today,
    lectures: baseLectures.map((lecture, idx) => ({
      ...lecture,
      slotIndex: lecture.slotIndex ?? idx,
      status: lecture.status ?? statusByLectureKey.get(lectureKey(lecture)) ?? null,
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
      (l) => l.subjectId === lecture.subjectId && l.slotIndex === lecture.slotIndex
    )?.status;
  }

  // If no lectures are scheduled and not editing, show a friendly prompt with "+ Add Classes"
  if (!todayData.lectures.length && !isEditing) {
    return (
      <Modal open={open} onClose={onClose} size="md">
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl">
            📅
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No lectures scheduled for today
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Your standard timetable has no classes today. If your timetable changed or extra classes were held, you can add them for today only.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Today’s Lectures
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
          {/* Header with Title and Edit Timetable Button */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Mark Today’s Attendance
                </h2>
                {isCustom && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Custom Schedule
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mark your presence or select lecture status below.
              </p>
            </div>

            {/* Edit 1-Day Timetable Button */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95 shrink-0"
              title="Edit lectures for today only if timetable changed"
            >
              <span>✏️</span>
              <span className="hidden sm:inline">Edit Today&apos;s Lectures</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </div>

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
                  className="rounded-2xl p-4 border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {subject.name}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                        {lecture.type || subject.type || "lecture"}
                      </p>
                    </div>
                    {status && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
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
