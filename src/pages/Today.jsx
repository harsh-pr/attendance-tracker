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
      <div className="grid md:grid-cols-2 gap-4">
        {Object.values(subjectData).map((item) => (
          <SubjectCard
            key={item.subject.id}
            data={item}
            onClick={() => setActive(item)}
          />
        ))}
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
      <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
        {subject.name}
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {subject.type.toUpperCase()}
      </p>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {attended} / {conducted} attended
      </p>

      <p
        className={`text-2xl font-bold mt-1 ${
          percentage >= 75
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {percentage}%
      </p>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {status}
      </p>
    </div>
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
