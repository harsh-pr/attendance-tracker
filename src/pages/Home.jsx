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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

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
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
    absent:
      "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
    free:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    cancelled:
      "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-8"
    >
      {/* ===== HEADER ===== */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 sm:block">
        <div className="flex items-center justify-between sm:block">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
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
                px-2 py-1 text-sm rounded-md
                bg-gray-100 dark:bg-gray-800
                border border-gray-300 dark:border-gray-700
                text-gray-900 dark:text-gray-100
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

        <p className="text-gray-600 dark:text-gray-400">
          Attendance overview
        </p>
      </motion.div>

      {/* ===== STAT CARDS ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              theoryPercentage >= 75
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {theoryPercentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Till today
          </p>
          <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, theoryPercentage))}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                theoryPercentage >= 75 ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
        </StatCard>

        {/* LABS */}
        <StatCard>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Attendance (Labs)
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              labPercentage >= 75
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {labPercentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Till today
          </p>
          <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, labPercentage))}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className={`h-full rounded-full ${
                labPercentage >= 75 ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
        </StatCard>

        {/* OVERALL */}
        <StatCard onClick={() => setOverallOpen(true)}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overall Attendance
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              overallPercentage >= 75
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {overallPercentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Till today
          </p>
          <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className={`h-full rounded-full ${
                overallPercentage >= 75 ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
        </StatCard>
      </motion.div>

      {/* ===== GRAPH ===== */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <AttendanceOverviewChart />
      </motion.div>

      {/* ===== LOGS ===== */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Attendance Logs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Latest entries with dates
            </p>
          </div>
          {logs.length > 7 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setAllLogsOpen(true)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </motion.button>
          )}
        </div>

        <div className="space-y-3">
          {visibleLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              No attendance logs yet.
            </div>
          ) : (
            visibleLogs.map((day, idx) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                className="rounded-xl bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
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
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {day.lectures.length === 0 ? (
                    <span className="text-gray-500 dark:text-gray-400">
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
                          className="flex items-center justify-between gap-2 rounded-lg border border-gray-200/70 dark:border-gray-700/70 px-3 py-2 text-xs text-gray-700 dark:text-gray-200"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {label}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {lecture.type}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
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
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

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
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Attendance Logs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full history with per-lecture status
            </p>
          </div>
        </div>

        <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              No attendance logs yet.
            </div>
          ) : (
            logs.map((day) => (
              <div
                key={`modal-${day.date}`}
                className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-4 border border-gray-200 dark:border-gray-700"
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
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {day.lectures.length === 0 ? (
                    <span className="text-gray-500 dark:text-gray-400">
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
                          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200/70 dark:border-gray-700/70 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {label}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {lecture.type}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
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
    </motion.div>
  );
}

/* ===== CARD ===== */
function StatCard({ children, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="
        rounded-2xl p-5 cursor-pointer
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-xl
      "
    >
      {children}
    </motion.div>
  );
}