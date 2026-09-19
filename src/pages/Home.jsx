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
  const defaultTodaySchedule = getLecturesForDate(
    today,
    currentSemester
  );
  const todayEntry = currentSemester.attendanceData.find(
    (day) => day.date === today
  );
  const todaySchedule =
    todayEntry?.lectures && todayEntry.lectures.length > 0
      ? todayEntry.lectures
      : defaultTodaySchedule;
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
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    absent:
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]",
    free:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]",
    cancelled:
      "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30",
    pending:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-24 space-y-8 overflow-x-hidden">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-[Poppins]">
              Attendance <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Overview</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <span>📊</span> Live Sync
            </span>
          </div>

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

        <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Real-time lecture tracking & semester 75% criterion status
        </p>
      </div>

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
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {theoryPercentage}%
          </p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Till today
          </p>
          <div className="mt-3 h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-800/80">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                theoryPercentage >= 75
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                  : "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
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
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {labPercentage}%
          </p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Till today
          </p>
          <div className="mt-3 h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-800/80">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                labPercentage >= 75
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                  : "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
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
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {overallPercentage}%
          </p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Till today
          </p>
          <div className="mt-3 h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-800/80">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                overallPercentage >= 75
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                  : "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>
        </StatCard>
      </div>

      <div className="w-full overflow-hidden">
        <AttendanceOverviewChart />
      </div>

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
                className="rounded-3xl bg-white dark:bg-[#09090d] sm:dark:bg-[#0c0d12] p-5 border border-zinc-200 dark:border-zinc-800/90 shadow-sm transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700/80"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-zinc-900 dark:text-white font-[Poppins] tracking-tight">
                    {new Date(day.date).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {new Date(day.date).toLocaleDateString("en-GB", { weekday: "short" })}
                  </span>
                </div>
                <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {day.lectures.length === 0 ? (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic py-1">
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
                          className="flex items-center justify-between gap-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#12131a] px-3.5 py-2.5 text-xs text-zinc-700 dark:text-zinc-200 min-w-0 overflow-hidden transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-zinc-900 dark:text-zinc-100" title={label}>
                              {label}
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                              {lecture.type}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize shrink-0 ${
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
                className="rounded-3xl bg-zinc-50 dark:bg-[#09090d] p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800/90 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-[Poppins]">
                    {new Date(day.date).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {new Date(day.date).toLocaleDateString("en-GB", { weekday: "short" })}
                  </span>
                </div>
                <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {day.lectures.length === 0 ? (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic py-1">
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
                          className="flex items-center justify-between gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#12131a] px-3.5 py-2.5 text-xs text-zinc-700 dark:text-zinc-200 min-w-0 overflow-hidden"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-zinc-900 dark:text-zinc-100" title={label}>
                              {label}
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
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

function StatCard({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        rounded-3xl p-5 cursor-pointer transform-gpu
        bg-white dark:bg-[#09090d] sm:dark:bg-[#0c0d12]
        border border-zinc-200 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-indigo-500/40
        shadow-sm hover:shadow-lg dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_24px_rgba(99,102,241,0.15)]
        transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98]
        will-change-transform
      "
    >
      {children}
    </div>
  );
}