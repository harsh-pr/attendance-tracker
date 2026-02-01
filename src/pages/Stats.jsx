import { useSemester } from "../context/SemesterContext";
import { getSubjectWiseStatus } from "../utils/attendanceUtils";

export default function Stats() {
  const { currentSemester } = useSemester(); // ✅ INSIDE component

  const data = getSubjectWiseStatus(
    currentSemester.attendanceData,
    currentSemester.subjects
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6">
      <h1 className="text-3xl font-bold mb-6">
        Subject-wise Attendance
      </h1>

      <div className="space-y-4">
        {Object.values(data).map((item) => (
          <div
            key={item.subject.id}
            className="rounded-xl bg-white dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-lg font-semibold">
              {item.subject.name}
              <span className="ml-2 text-sm text-gray-500">
                ({item.subject.type})
              </span>
            </h2>

            <p>
              {item.attended} / {item.conducted} lectures
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.percentage}% attendance
            </p>

            <p
              className={`mt-2 font-medium ${
                item.statusData.status === "Safe"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {item.statusData.status === "Safe"
                ? `Will fall below 75% after ${item.statusData.willFallAfter} absence`
                : `Needs ${item.statusData.needed} more lectures`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
