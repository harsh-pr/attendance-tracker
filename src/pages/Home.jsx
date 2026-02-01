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
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-400">
          Attendance overview
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* TODAY */}
        <StatCard onClick={() => setQuickOpen(true)}>
          <p className="text-sm text-gray-400">Today</p>
          <p className="text-3xl font-bold text-white mt-1">
            {todayAttended} / {todayTotal}
          </p>
          <p className="text-sm text-gray-400">
            Lectures attended
          </p>
        </StatCard>

        {/* THEORY */}
        <StatCard>
          <p className="text-sm text-gray-400">
            Attendance (Theory)
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              theory.percentage >= 75
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {theory.percentage}%
          </p>
          <p className="text-sm text-gray-400">
            Till today
          </p>
        </StatCard>

        {/* LABS */}
        <StatCard>
          <p className="text-sm text-gray-400">
            Attendance (Labs)
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              lab.percentage >= 75
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {lab.percentage}%
          </p>
          <p className="text-sm text-gray-400">
            Till today
          </p>
        </StatCard>

        {/* OVERALL */}
        <StatCard onClick={() => setOverallOpen(true)}>
          <p className="text-sm text-gray-400">
            Overall Attendance
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              overall.percentage >= 75
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {overall.percentage}%
          </p>
          <p className="text-sm text-gray-400">
            Till today
          </p>
        </StatCard>
      </div>

      {/* GRAPH */}
      <AttendanceOverviewChart />

      {/* MODALS */}
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

function StatCard({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        rounded-2xl p-5
        bg-gray-800
        border border-gray-700
        cursor-pointer
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        active:scale-95
      "
    >
      {children}
    </div>
  );
}
