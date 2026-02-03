import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useSemester } from "../context/SemesterContext";

/* ===== PREMIUM TOOLTIP (NO WHITE OVERLAY) ===== */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload.reduce((acc, item) => {
    acc[item.dataKey] = item.value;
    return acc;
  }, {});

  return (
    <div className="
      rounded-xl px-4 py-3
      bg-gray-900 text-white
      shadow-2xl border border-gray-700
    ">
      <p className="text-sm font-semibold mb-2">{label}</p>

      <div className="space-y-1 text-sm">
        <p className="text-gray-300">
          Conducted: <span className="text-white">{data.conducted ?? 0}</span>
        </p>
        <p className="text-blue-400">
          Attended: <span>{data.attended ?? 0}</span>
        </p>
        <p className="text-green-400">
          Overall Attendance: <span>{data.percentage ?? 0}%</span>
        </p>
      </div>
    </div>
  );
}

export default function AttendanceOverviewChart() {
  const { currentSemester } = useSemester();

  /* ===== SORT DAYS ===== */
  const sortedDays = [...currentSemester.attendanceData]
    .filter(d => d.lectures.length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  /* ===== CUMULATIVE TOTAL ===== */
  let totalConducted = 0;
  let totalAttended = 0;

  const data = sortedDays.map(day => {
    let conductedToday = 0;
    let attendedToday = 0;

    day.lectures.forEach(l => {
      if (l.status === "cancelled") return;
      conductedToday++;
      if (l.status === "present" || l.status === "free") {
        attendedToday++;
      }
    });

    totalConducted += conductedToday;
    totalAttended += attendedToday;

    return {
      date: new Date(day.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      conducted: conductedToday,
      attended: attendedToday,
      percentage:
        totalConducted === 0
          ? 0
          : Math.round((totalAttended / totalConducted) * 100),
    };
  }).slice(-7);

  return (
    <div
      className="
        rounded-2xl p-6 transition-transform hover:scale-[1.01]

        /* LIGHT */
        bg-white border border-gray-200 text-gray-900

        /* DARK */
        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100
      "
    >
      <h2 className="text-lg font-semibold mb-4">
        Attendance – Last 7 Days
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          {/* ===== GRID (VISIBLE IN LIGHT) ===== */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-600"
            opacity={0.6}
          />

          {/* ===== AXES ===== */}
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            yAxisId="lectures"
            allowDecimals={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            yAxisId="percentage"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "transparent" }}   // 🚫 NO WHITE OVERLAY
          />

          <Legend />

          {/* ===== GRADIENTS ===== */}
          <defs>
            <linearGradient id="attendedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
            </linearGradient>

            <linearGradient id="conductedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#6b7280" stopOpacity={0.6} />
            </linearGradient>
          </defs>

          <Bar
            yAxisId="lectures"
            dataKey="conducted"
            name="Lectures Conducted"
            fill="url(#conductedGradient)"
            radius={[8, 8, 0, 0]}
            animationDuration={600}
          />

          <Bar
            yAxisId="lectures"
            dataKey="attended"
            name="Lectures Attended"
            fill="url(#attendedGradient)"
            radius={[8, 8, 0, 0]}
            animationDuration={600}
          />

          <Line
            yAxisId="percentage"
            type="monotone"
            dataKey="percentage"
            name="Overall Attendance %"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#22c55e" }}
            activeDot={{ r: 6 }}
            style={{
              filter: "drop-shadow(0 0 6px rgba(34,197,94,0.6))",
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
