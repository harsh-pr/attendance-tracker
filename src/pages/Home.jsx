import { useState } from "react";
import { motion } from "framer-motion";
import { useSemester } from "../context/SemesterContext";
import { calculateOverallAttendance } from "../utils/attendanceUtils";
import { getTodayDate } from "../store/attendanceStore";
import { getLecturesForDate } from "../utils/timetableUtils";

import AttendanceOverviewChart from "../components/AttendanceOverviewChart";
import QuickTodayAttendance from "../components/QuickTodayAttendance";
import OverallAttendanceModal from "../components/OverallAttendanceModal";
import Modal from "../components/Modal";

export default function Home() {
  const {
    currentSemester,
    setCurrentSemesterId,
    semesters,
  } = useSemester();

  const [quickOpen, setQuickOpen] = useState(false);
  const [overallOpen, setOverallOpen] = useState(false);
  const [allLogsOpen, setAllLogsOpen] = useState(false);

  const { theory, lab, overall } =
    calculateOverallAttendance(currentSemester);
  const theoryPercentage = theory?.percentage ?? 0;
  const labPercentage = lab?.percentage ?? 0;
  const overallPercentage = overall?.percentage ?? 0;

  const today = getTodayDate();
  const todaySchedule = getLecturesForDate(
    today,
    currentSemester
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
      slotIndex: lecture.slotIndex,
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
  const visibleLogs = logs.slice(0, 7);
  const statusStyles = {
    present:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    absent:
      "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    free:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    cancelled:
      "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20",
    pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-8 overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-2 sm:block">
        <div className="flex items-center justify-between sm:block">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>

          {/* ===== MOBILE ONLY SEMESTER SELECTOR ===== */}
          <div className="sm:hidden">
            <select
              value={currentSemester.id}
              onChange={(e) => {
                setCurrentSemesterId(e.target.value);
              }}
              className="
                px-3 py-1.5 text-xs font-semibold rounded-xl
                bg-zinc-100 dark:bg-zinc-900
                border border-zinc-300 dark:border-zinc-800
                text-zinc-900 dark:text-zinc-100
              "
            >
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Attendance overview
        </p>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TODAY */}
        <StatCard onClick={() => setQuickOpen(true)}>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Today
          </p>
          <p className="text-3xl font-black mt-1 text-zinc-900 dark:text-white">
            {todayAttended} / {todayTotal}
          </p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Lectures attended
          </p>
          <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            {todaySubjects.length === 0 ? (
              <p>No lectures today 🎉</p>
            ) : (
              todaySubjects.map((subject) => (
                <p key={`${today}-${subject.id}-${subject.slotIndex ?? 0}`} className="truncate">
                  • {subject.name} ({subject.type})
                </p>
              ))
            )}
          </div>
        </StatCard>

        {/* THEORY */}
        <StatCard>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Attendance (Theory)
          </p>
          <p
            className={`text-3xl font-black mt-1 ${
              theoryPercentage >= 75
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {theoryPercentage}%
          </p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Till today
          </p>
          <div className="mt-3 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                theoryPercentage >= 75 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, theoryPercentage))}%` }}
            />
          </div>
        </StatCard>

        {/* LABS */}
        <StatCard>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Attendance (Labs)
          </p>
          <p
            className={`text-3xl font-black mt-1 ${
              labPercentage >= 75
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {labPercentage}%
          </p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Till today
          </p>
          <div className="mt-3 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                labPercentage >= 75 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, labPercentage))}%` }}
            />
          </div>
        </StatCard>

        {/* OVERALL */}
        <StatCard onClick={() => setOverallOpen(true)}>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Overall Attendance
          </p>
          <p
            className={`text-3xl font-black mt-1 ${
              overallPercentage >= 75
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {overallPercentage}%
          </p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Till today
          </p>
          <div className="mt-3 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage >= 75 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>
        </StatCard>
      </div>

      {/* ===== GRAPH ===== */}
      <div className="w-full overflow-hidden">
        <AttendanceOverviewChart />
      </div>

      {/* ===== LOGS ===== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Attendance Logs
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Latest entries with dates
            </p>
          </div>
          {logs.length > 7 && (
            <button
              type="button"
              onClick={() => setAllLogsOpen(true)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </button>
          )}
        </div>

        <div className="space-y-3">
          {visibleLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No attendance logs yet.
            </div>
          ) : (
            visibleLogs.map((day) => (
              <div
                key={day.date}
                className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors"
              >
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {new Date(day.date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {day.lectures.length === 0 ? (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Holiday / No lectures
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
                        <div
                          key={`${day.date}-${lecture.subjectId}-${index}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 min-w-0 overflow-hidden"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100" title={label}>
                              {label}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {lecture.type}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize shrink-0 ${
                              statusStyles[statusLabel]
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
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

      <Modal
        open={allLogsOpen}
        onClose={() => setAllLogsOpen(false)}
        size="xl"
        title="Attendance Logs"
      >
        <div className="mt-1 space-y-4">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No attendance logs yet.
            </div>
          ) : (
            logs.map((day) => (
              <div
                key={`modal-${day.date}`}
                className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-4 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {new Date(day.date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {day.lectures.length === 0 ? (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Holiday
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
                        <div
                          key={`modal-${day.date}-${lecture.subjectId}-${index}`}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 min-w-0 overflow-hidden"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100" title={label}>
                              {label}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {lecture.type}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                              statusStyles[statusLabel]
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ===== CARD ===== */
function StatCard({ children, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="
        rounded-3xl p-5 cursor-pointer
        bg-white dark:bg-zinc-900
        border border-zinc-200 dark:border-zinc-800
        shadow-sm hover:shadow-lg transition-shadow duration-200
      "
    >
      {children}
    </motion.div>
  );
}