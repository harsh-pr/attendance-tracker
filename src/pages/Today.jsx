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

  const theoryConducted = theorySubjects.reduce((sum, item) => sum + item.conducted, 0);
  const theoryAttended = theorySubjects.reduce((sum, item) => sum + item.attended, 0);
  const labConducted = labSubjects.reduce((sum, item) => sum + item.conducted, 0);
  const labAttended = labSubjects.reduce((sum, item) => sum + item.attended, 0);
  const totalConducted = theoryConducted + labConducted;
  const totalAttended = theoryAttended + labAttended;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 pt-6 space-y-6"
    >
      {/* ===== EXECUTIVE SECTION HEADER ===== */}
      <motion.div variants={cardVariants} className="space-y-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-[Poppins]">
            Subject-wise <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Attendance</span>
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
            <span>📚</span> Course Breakdown
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Theory & Lab attendance till date • Click any subject card to view interactive calendar logs
        </p>

        {/* Classes Conducted Summary Line */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 font-semibold shadow-xs">
            <span className="text-zinc-400">📊</span>
            <span>Total Classes Conducted:</span>
            <span className="font-extrabold text-zinc-900 dark:text-white">{totalConducted}</span>
            <span className="text-[10px] text-zinc-400 font-normal">({totalAttended} attended)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-semibold">
            <span>Theory:</span>
            <span className="font-extrabold">{theoryConducted}</span>
            <span className="text-[10px] opacity-75 font-normal">({theoryAttended} attended)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-semibold">
            <span>Lab:</span>
            <span className="font-extrabold">{labConducted}</span>
            <span className="text-[10px] opacity-75 font-normal">({labAttended} attended)</span>
          </span>
        </div>
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