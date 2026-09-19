import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useSemester } from "../context/SemesterContext";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload.reduce((acc, item) => {
    acc[item.dataKey] = item.value;
    return acc;
  }, {});

  return (
    <div className="
      rounded-2xl px-4 py-3
      bg-[#0c0d12] text-white border border-zinc-700/80
      shadow-2xl
    ">
      <p className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">{label}</p>

      <div className="space-y-1.5 text-xs font-semibold">
        <p className="text-zinc-600 dark:text-zinc-300 flex items-center justify-between gap-4">
          <span>Conducted:</span>
          <span className="text-zinc-900 dark:text-white font-extrabold">{data.conducted ?? 0}</span>
        </p>
        <p className="text-blue-600 dark:text-blue-400 flex items-center justify-between gap-4">
          <span>Attended:</span>
          <span className="font-extrabold">{data.attended ?? 0}</span>
        </p>
        <p className="text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-4 pt-1 border-t border-zinc-200 dark:border-white/[0.08]">
          <span>Overall:</span>
          <span className="font-extrabold">{data.percentage ?? 0}%</span>
        </p>
      </div>
    </div>
  );
}

export default function AttendanceOverviewChart() {
  const { currentSemester } = useSemester();

  const sortedDays = [...currentSemester.attendanceData]
    .filter(d => d.lectures.length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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
        rounded-3xl p-6 overflow-hidden w-full max-w-full
        bg-white dark:bg-[#09090d] sm:dark:bg-[#0c0d12]
        border border-zinc-200 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700
        shadow-sm hover:shadow-lg dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.8)]
        transition-all duration-200
      "
    >
      <h2 className="text-lg font-bold mb-4 font-[Poppins] text-zinc-900 dark:text-white">
        Attendance – Last 7 Days
      </h2>

      <div className="relative w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="99%" height={320}>
          <BarChart data={data}>

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
            cursor={{ fill: "transparent" }}
          />

          <Legend />

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
    </div>
  );
}
