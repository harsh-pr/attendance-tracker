import {
  ResponsiveContainer,
  LineChart,
  Line,
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
    <div className="rounded-xl px-4 py-3 bg-gray-900 text-white shadow-2xl border border-gray-700">
      <p className="text-sm font-semibold mb-2">{label}</p>
      <p className="text-green-400 text-sm">
        Overall Attendance:{" "}
        <span className="font-medium">
          {payload[0].value}%
        </span>
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
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#22c55e" }}
            activeDot={{ r: 6 }}
            isAnimationActive
            animationDuration={1200}
            animationEasing="linear"
            style={{
              filter:
                "drop-shadow(0 0 6px rgba(34,197,94,0.6))",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Modal>
  );
}