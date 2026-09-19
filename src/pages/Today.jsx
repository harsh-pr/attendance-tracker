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

      <SubjectCalendarModal
        open={Boolean(selectedSubjectData)}
        onClose={() => setSelectedSubjectData(null)}
        data={selectedSubjectData}
      />
    </motion.div>
  );
}

function SubjectCard({ data, onClick }) {
  const { subject, attended, conducted, percentage, status } =
    data;
  const statusStyles = {
    Safe: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    Risk: "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]",
    "No Data":
      "bg-zinc-800/60 text-zinc-400 border border-zinc-700/50",
  };

  return (
    <div
      onClick={onClick}
      className="
        p-5 rounded-3xl cursor-pointer transform-gpu
        bg-white dark:bg-[#09090d] sm:dark:bg-[#0c0d12]
        border border-zinc-200 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-indigo-500/40
        shadow-sm hover:shadow-lg dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_24px_rgba(99,102,241,0.15)]
        transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98]
        will-change-transform
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-base text-zinc-900 dark:text-white font-[Poppins]">
            {subject.name}
          </h2>
          <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
            {subject.type}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            statusStyles[status]
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
          <span>
            {attended} / {conducted} attended
          </span>
          <span className="font-extrabold text-zinc-900 dark:text-white">{percentage}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              percentage >= 75
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                : "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>
    </div>
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