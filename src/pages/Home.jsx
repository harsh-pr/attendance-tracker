import { useState } from "react";
import { useSemester } from "../context/SemesterContext";
import { calculateOverallAttendance } from "../utils/attendanceUtils";
import { getTodayDate } from "../store/attendanceStore";
import { getLecturesForDate } from "../utils/timetableUtils";
import AttendanceOverviewChart from "../components/AttendanceOverviewChart";
import QuickTodayAttendance from "../components/QuickTodayAttendance";
import OverallAttendanceModal from "../components/OverallAttendanceModal";

export default function Home() {
  const { currentSemester } = useSemester();

  const [quickOpen, setQuickOpen] = useState(false);
  const [overallOpen, setOverallOpen] = useState(false);

  const { theory, lab, overall } =
    calculateOverallAttendance(currentSemester);

  const today = getTodayDate();
  const todaySchedule = getLecturesForDate(
    today,
    currentSemester.id
  );
  const todayEntry = currentSemester.attendanceData.find(
    (day) => day.date === today
  );
  const todayAttended = todayEntry
    ? todayEntry.lectures.filter(
        (lecture) =>
          lecture.status === "present" ||
          lecture.status === "free"
      ).length
    : 0;
  const todayTotal = todaySchedule.length;
  const subjectsById = new Map(
    currentSemester.subjects.map((subject) => [
      subject.id,
      subject,
    ])
  );
  const todaySubjects = todaySchedule.map((lecture) => {
    const subject = subjectsById.get(lecture.subjectId);
    return {
      id: lecture.subjectId,
      name: subject ? subject.name : lecture.subjectId,
      type: lecture.type,
    };
  });

  const todayLogEntry =
    todayEntry ||
    (todaySchedule.length > 0
      ? {
          date: today,
          lectures: todaySchedule.map((lecture) => ({
            ...lecture,
            status: null,
          })),
        }
      : null);
  const logs = [
    ...currentSemester.attendanceData.filter(
      (day) => day.date !== today
    ),
    ...(todayLogEntry ? [todayLogEntry] : []),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-8">
      {/* ===== HEADER ===== */}
<div className="flex flex-col gap-2 sm:block">
  <div className="flex items-center justify-between sm:block">
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
      Dashboard
    </h1>

    {/* ===== MOBILE ONLY SEMESTER SELECTOR ===== */}
    <div className="sm:hidden">
        <select
            value={currentSemester.id}
            onChange={(e) => {}}
            disabled
            className="
              px-2 py-1 text-sm rounded-md
              bg-gray-100 dark:bg-gray-800
              border border-gray-300 dark:border-gray-700
              text-gray-900 dark:text-gray-100
            "
          >
            <option>{currentSemester.name}</option>
          </select>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Attendance overview
      </p>
    </div>


      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TODAY */}
        <StatCard onClick={() => setQuickOpen(true)}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Today
          </p>
          <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
            {todayAttended} / {todayTotal}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lectures attended
          </p>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            {todaySubjects.length === 0 ? (
              <p>No lectures today 🎉</p>
            ) : (
              todaySubjects.map((subject) => (
                <p key={`${today}-${subject.id}`}>
                  {subject.name} ({subject.type})
                </p>
              ))
            )}
          </div>
        </StatCard>

        {/* THEORY */}
        <StatCard>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Attendance (Theory)
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              theory.percentage >= 75
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {theory.percentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Till today
          </p>
        </StatCard>

        {/* LABS */}
        <StatCard>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Attendance (Labs)
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              lab.percentage >= 75
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {lab.percentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Till today
          </p>
        </StatCard>

        {/* OVERALL */}
        <StatCard onClick={() => setOverallOpen(true)}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overall Attendance
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              overall.percentage >= 75
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {overall.percentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Till today
          </p>
        </StatCard>
      </div>

      {/* ===== GRAPH ===== */}
      <AttendanceOverviewChart />

      {/* ===== LOGS ===== */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Attendance Logs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest entries with dates
          </p>
        </div>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              No attendance logs yet.
            </div>
          ) : (
            logs.map((day) => (
              <div
                key={day.date}
                className="rounded-xl bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(day.date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {day.lectures.length === 0 ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      Holiday / No lectures attended
                    </span>
                  ) : (
                    day.lectures.map((lecture, index) => {
                      const subject = subjectsById.get(
                        lecture.subjectId
                      );
                      const label = subject
                        ? subject.name
                        : lecture.subjectId;
                      const statusLabel =
                        lecture.status ?? "pending";
                      return (
                        <span
                          key={`${day.date}-${lecture.subjectId}-${index}`}
                          className="rounded-full border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-600 dark:text-gray-300"
                        >
                          {label} • {statusLabel}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== MODALS ===== */}
      <QuickTodayAttendance
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
      />

      <OverallAttendanceModal
        open={overallOpen}
        onClose={() => setOverallOpen(false)}
      />
    </div>
  );
}

/* ===== CARD ===== */
function StatCard({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        rounded-2xl p-5 cursor-pointer
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        active:scale-95
      "
    >
      {children}
    </div>
  );
}
