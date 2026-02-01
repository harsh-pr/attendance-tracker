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

/* =======================
   PREMIUM CUSTOM TOOLTIP
   ======================= */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload.reduce((acc, item) => {
    acc[item.dataKey] = item.value;
    return acc;
  }, {});

  return (
    <div className="rounded-xl px-4 py-3 bg-gray-900 text-white shadow-2xl border border-gray-700">
      <p className="text-sm font-semibold mb-2">{label}</p>

      <div className="space-y-1 text-sm">
        <p className="text-gray-300">
          Conducted:{" "}
          <span className="text-white font-medium">
            {data.conducted ?? 0}
          </span>
        </p>

        <p className="text-blue-400">
          Attended:{" "}
          <span className="font-medium">
            {data.attended ?? 0}
          </span>
        </p>

        <p className="text-green-400">
          Overall Attendance:{" "}
          <span className="font-medium">
            {data.percentage ?? 0}%
          </span>
        </p>
      </div>
    </div>
  );
}

/* =======================
   MAIN CHART COMPONENT
   ======================= */
export default function AttendanceOverviewChart() {
  const { currentSemester } = useSemester();

  /* -------- Last 7 days -------- */
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  /* -------- CUMULATIVE TOTALS -------- */
  let totalConducted = 0;
  let totalAttended = 0;

  const data = last7Days.map((date) => {
    const day = currentSemester.attendanceData.find(
      (d) => d.date === date
    );

    let conductedToday = 0;
    let attendedToday = 0;

    if (day) {
      day.lectures.forEach((l) => {
        // 🚫 cancelled → ignored
        if (l.status === "cancelled") return;

        // ✅ lecture conducted
        conductedToday++;

        // ✅ present OR free → attended
        if (l.status === "present" || l.status === "free") {
          attendedToday++;
        }
      });
    }

    // 🔁 accumulate totals
    totalConducted += conductedToday;
    totalAttended += attendedToday;

    // 📈 OVERALL attendance till this day
    let percentage = 0;
    if (totalConducted > 0) {
      percentage = Math.round(
        (totalAttended / totalConducted) * 100
      );
    }

    return {
      date: new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      conducted: conductedToday,
      attended: attendedToday,
      percentage,
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.01]">
      <h2 className="text-lg font-semibold mb-4">
        Attendance – Last 7 Days
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          {/* ===== GRADIENTS ===== */}
          <defs>
            <linearGradient id="attendedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
            </linearGradient>

            <linearGradient id="conductedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#475569" stopOpacity={0.6} />
            </linearGradient>
          </defs>

          {/* ===== GRID ===== */}
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

          {/* ===== X AXIS ===== */}
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* ===== LEFT Y AXIS (LECTURES) ===== */}
          <YAxis
            yAxisId="lectures"
            domain={[0, "dataMax + 1"]}
            allowDecimals={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* ===== RIGHT Y AXIS (PERCENTAGE) ===== */}
          <YAxis
            yAxisId="percentage"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* ===== TOOLTIP ===== */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(59,130,246,0.08)" }}
          />

          <Legend />

          {/* ===== BARS ===== */}
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

          {/* ===== LINE (OVERALL ATTENDANCE) ===== */}
          <Line
            yAxisId="percentage"
            type="monotone"
            dataKey="percentage"
            name="Overall Attendance %"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#22c55e" }}
            activeDot={{ r: 6 }}
            isAnimationActive
            style={{
              filter: "drop-shadow(0 0 6px rgba(34,197,94,0.6))",
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
