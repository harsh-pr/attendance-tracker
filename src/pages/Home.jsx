import { useState } from "react";
import { useSemester } from "../context/SemesterContext";
import { calculateOverallAttendance } from "../utils/attendanceUtils";

import AttendanceOverviewChart from "../components/AttendanceOverviewChart";
import QuickTodayAttendance from "../components/QuickTodayAttendance";
import OverallAttendanceModal from "../components/OverallAttendanceModal";

export default function Home() {
  const { currentSemester } = useSemester();

  const [quickOpen, setQuickOpen] = useState(false);
  const [overallOpen, setOverallOpen] = useState(false);

  const {
    todayAttended,
    todayTotal,
    theory,
    lab,
    overall,
  } = calculateOverallAttendance(currentSemester);

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
