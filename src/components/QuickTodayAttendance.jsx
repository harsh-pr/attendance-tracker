import Modal from "./Modal";
import { useSemester } from "../context/SemesterContext";
import { getTodayDate } from "../store/attendanceStore";
import { ensureDayExists } from "../store/attendanceStore";

const ACTIONS = ["present", "absent", "free", "cancelled"];

export default function QuickTodayAttendance({ open, onClose }) {
  const { currentSemester, markTodayAttendance } = useSemester();
  const today = getTodayDate();

  const todayData = ensureDayExists(
    currentSemester,
    today
  );

  if (!todayData) {
    return (
      <Modal open={open} onClose={onClose}>
        <p className="text-gray-500 dark:text-gray-400">
          No lectures scheduled for today 🎉
        </p>
      </Modal>
    );
  }

  function getStatus(subjectId) {
    return todayData.lectures.find(
      (l) => l.subjectId === subjectId
    )?.status;
  }

  return (
    <Modal open={open} onClose={onClose}>
      {/* ===== MODAL TITLE ===== */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Mark Today’s Attendance
      </h2>

      {/* ===== SUBJECT LIST ===== */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {currentSemester.subjects.map((subject) => {
          const status = getStatus(subject.id);

          return (
            <div
              key={subject.id}
              className="
                rounded-xl p-4
                border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-900
              "
            >
              {/* ===== SUBJECT INFO ===== */}
              <div className="mb-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {subject.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subject.type}
                </p>
              </div>

              {/* ===== ACTION BUTTONS ===== */}
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() =>
                      markTodayAttendance(subject.id, action)
                    }
                    className={`
                      px-3 py-1.5 rounded-lg text-sm capitalize
                      cursor-pointer
                      transition-all duration-200
                      ${
                        status === action
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                      active:scale-95
                    `}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
