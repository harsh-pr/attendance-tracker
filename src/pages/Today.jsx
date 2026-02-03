import { useState } from "react";
import { useSemester } from "../context/SemesterContext";
import { getSubjectWiseStatus } from "../utils/attendanceUtils";
import Modal from "../components/Modal";

export default function Today() {
  const { currentSemester } = useSemester();
  const subjectData = getSubjectWiseStatus(
    currentSemester.attendanceData,
    currentSemester.subjects
  );

  const subjects = Object.values(subjectData);
  const theorySubjects = subjects.filter(
    (item) => item.subject.type === "theory"
  );
  const labSubjects = subjects.filter(
    (item) => item.subject.type === "lab"
  );

  const [active, setActive] = useState(null);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Subject-wise Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theory & Lab attendance till date
        </p>
      </div>

      {/* ===== SUBJECT GRID ===== */}
      <div className="space-y-6">
        <SubjectSection
          title="Theory"
          items={theorySubjects}
          onSelect={setActive}
        />
        <SubjectSection
          title="Labs"
          items={labSubjects}
          onSelect={setActive}
        />
      </div>

      {/* ===== MODAL ===== */}
      {active && (
        <SubjectModal
          data={active}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

/* =======================
   SUBJECT CARD
======================= */
function SubjectCard({ data, onClick }) {
  const { subject, attended, conducted, percentage, status } =
    data;
  const statusStyles = {
    Safe: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
    Risk: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
    "No Data":
      "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
  };

  return (
    <div
      onClick={onClick}
      className="
        p-5 rounded-2xl cursor-pointer
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        active:scale-95
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {subject.name}
          </h2>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {subject.type}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusStyles[status]
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>
            {attended} / {conducted} attended
          </span>
          <span className="font-semibold">{percentage}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-2 rounded-full ${
              percentage >= 75
                ? "bg-green-500"
                : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SubjectSection({ title, items, onSelect }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {items.length} subjects
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
          No subjects yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <SubjectCard
              key={item.subject.id}
              data={item}
              onClick={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* =======================
   SUBJECT MODAL
======================= */
function SubjectModal({ data, onClose }) {
  const { subject, attended, conducted, percentage } =
    data;

  return (
    <Modal open onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {subject.name}
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {subject.type.toUpperCase()} lecture summary
      </p>

      <div className="space-y-2 text-gray-700 dark:text-gray-300">
        <p>Total Conducted: {conducted}</p>
        <p>Total Attended: {attended}</p>

        <p
          className={`text-lg font-semibold ${
            percentage >= 75
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          Attendance: {percentage}%
        </p>
      </div>
    </Modal>
  );
}
