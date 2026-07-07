// src/components/QuickTodayAttendance.jsx
import Modal from "./Modal";
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
  const { currentSemester, markTodayAttendance } = useSemester();
  const today = getTodayDate();

  const todayEntry = currentSemester.attendanceData.find(
    (day) => day.date === today
  );
  const timetableLectures = getLecturesForDate(today, currentSemester);
  const statusBySubjectId = new Map(
    (todayEntry?.lectures || []).map((lecture) => [
      lecture.subjectId,
      lecture.status,
    ])
  );

  const todayData = {
    date: today,
    lectures: timetableLectures.map((lecture) => ({
      ...lecture,
      status: statusBySubjectId.get(lecture.subjectId) ?? null,
    })),
  };
  const subjectsById = new Map(
    currentSemester.subjects.map((subject) => [
      subject.id,
      subject,
    ])
  );

  if (!todayData.lectures.length) {
    return (
      <Modal open={open} onClose={onClose}>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-center">
          No lectures scheduled for today 🎉
        </p>
      </Modal>
    );
  }

  function getStatus(subjectId) {
    return todayData.lectures.find(
      l => l.subjectId === subjectId
    )?.status;
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Mark Today’s Attendance
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Mark your presence or select lecture status below.</p>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {todayData.lectures.map((lecture) => {
          const subject = subjectsById.get(
            lecture.subjectId
          );
          if (!subject) return null;
          const status = getStatus(lecture.subjectId);

          return (
            <div
              key={`${today}-${lecture.subjectId}`}
              className="rounded-2xl p-4 border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/40 space-y-3"
            >
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {subject.name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  {lecture.type || subject.type || "lecture"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ACTIONS.map(action => {
                  const style = optionStyles[action];
                  const isSelected = status === action;
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => markTodayAttendance(subject.id, action)}
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
    </Modal>
  );
}
