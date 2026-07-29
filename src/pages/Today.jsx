import { useState } from "react";
import { motion } from "framer-motion";
import { useSemester } from "../context/SemesterContext";
import { getSubjectWiseStatus } from "../utils/attendanceUtils";
import SubjectCalendarModal from "../components/SubjectCalendarModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

export default function Today() {
  const { currentSemester } = useSemester();
  const [selectedSubjectData, setSelectedSubjectData] = useState(null);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 pt-6 space-y-6"
    >
      {/* ===== HEADER ===== */}
      <motion.div variants={cardVariants}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Subject-wise Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theory & Lab attendance till date. Click a card to view calendar dates.
        </p>
      </motion.div>

      {/* ===== SUBJECT GRID ===== */}
      <div className="space-y-6">
        <SubjectSection
          title="Theory"
          items={theorySubjects}
          onCardClick={setSelectedSubjectData}
        />
        <SubjectSection
          title="Labs"
          items={labSubjects}
          onCardClick={setSelectedSubjectData}
        />
      </div>

      {/* ===== CALENDAR MODAL ===== */}
      {selectedSubjectData && (
        <SubjectCalendarModal
          open={Boolean(selectedSubjectData)}
          onClose={() => setSelectedSubjectData(null)}
          data={selectedSubjectData}
        />
      )}
    </motion.div>
  );
}

/* =======================
   SUBJECT CARD
======================= */
function SubjectCard({ data, onClick }) {
  const { subject, attended, conducted, percentage, status } =
    data;
  const statusStyles = {
    Safe: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    Risk: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    "No Data":
      "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20",
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="
        p-5 rounded-3xl
        bg-white dark:bg-zinc-900
        border border-zinc-200 dark:border-zinc-800
        cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-200
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            {subject.name}
          </h2>
          <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
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
        <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              percentage >= 75
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function SubjectSection({ title, items, onCardClick }) {
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2"
        >
          {items.map((item) => (
            <SubjectCard
              key={item.subject.id}
              data={item}
              onClick={() => onCardClick(item)}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
}