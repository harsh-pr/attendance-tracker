import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Modal from "./Modal";
import { useSemester } from "../context/SemesterContext";

/* ===== Premium tooltip ===== */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-2xl px-4 py-3 bg-white/95 dark:bg-gray-950/90 text-gray-950 dark:text-gray-100 shadow-xl border border-gray-200/50 dark:border-gray-800/80 backdrop-blur-md">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mt-1">
        Attendance: <span className="text-lg font-extrabold">{payload[0].value}%</span>
      </p>
    </div>
  );
}

export default function OverallAttendanceModal({ open, onClose }) {
  const { currentSemester } = useSemester();

  /* ===== SORT DAYS CHRONOLOGICALLY ===== */
  const sortedDays = [...currentSemester.attendanceData].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let totalConducted = 0;
  let totalAttended = 0;

  /* ===== CUMULATIVE OVERALL ATTENDANCE ===== */
  const data = sortedDays.map((day) => {
    day.lectures.forEach((l) => {
      if (l.status === "cancelled") return;

      totalConducted++;
      if (l.status === "present" || l.status === "free") {
        totalAttended++;
      }
    });

    const percentage =
      totalConducted === 0
        ? 0
        : Math.round((totalAttended / totalConducted) * 100);

    return {
      date: new Date(day.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      percentage,
    };
  });

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Overall Attendance Trend
      </h2>

      <ResponsiveContainer width="100%" height={380}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />

          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dx={-8}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(16, 185, 129, 0.2)", strokeWidth: 1.5 }} />

          <Area
            type="monotone"
            dataKey="percentage"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPercentage)"
            dot={{ r: 3, fill: "#10b981", stroke: "#10b981", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Modal>
  );
}