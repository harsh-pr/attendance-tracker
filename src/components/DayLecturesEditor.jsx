// src/components/DayLecturesEditor.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", color: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" },
  { value: "absent", label: "Absent", color: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30" },
  { value: "free", label: "Free", color: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30" },
  { value: "cancelled", label: "Cancelled", color: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700" },
  { value: null, label: "Pending", color: "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800" },
];

export default function DayLecturesEditor({
  date,
  initialLectures = [],
  subjects = [],
  onSave,
  onCancel,
  onResetToDefault,
  isCustom = false,
  dateLabel,
}) {
  const [lectures, setLectures] = useState(() => {
    if (!initialLectures || initialLectures.length === 0) {
      // If empty, start with one blank slot if subjects exist
      return subjects.length > 0
        ? [
            {
              subjectId: subjects[0].id,
              type: subjects[0].type || "theory",
              status: null,
              slotIndex: 0,
            },
          ]
        : [];
    }
    return initialLectures.map((l, idx) => ({
      subjectId: l.subjectId,
      type: l.type || "theory",
      status: l.status !== undefined ? l.status : null,
      slotIndex: idx,
    }));
  });

  const formattedDate =
    dateLabel ||
    (date
      ? new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Selected Day");

  function handleAddLecture() {
    if (subjects.length === 0) return;
    const defaultSub = subjects[0];
    setLectures((prev) => [
      ...prev,
      {
        subjectId: defaultSub.id,
        type: defaultSub.type || "theory",
        status: null,
        slotIndex: prev.length,
      },
    ]);
  }

  function handleRemoveLecture(index) {
    setLectures((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateLecture(index, field, value) {
    setLectures((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const updated = { ...l, [field]: value };
        if (field === "subjectId") {
          const sub = subjects.find((s) => s.id === value);
          if (sub?.type) {
            updated.type = sub.type;
          }
        }
        return updated;
      })
    );
  }

  function handleMove(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lectures.length) return;
    setLectures((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  }

  function handleSave() {
    onSave(lectures);
  }

  return (
    <div className="space-y-4">
      {/* Informative Header */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
        <span className="text-base leading-none">⚡</span>
        <div>
          <span className="font-bold">Editing ONLY for {formattedDate}:</span>
          <p className="opacity-90 mt-0.5 leading-relaxed">
            Changes made here will strictly apply to this single day and will update attendance for these subjects. Your regular weekly timetable will not be altered.
          </p>
        </div>
      </div>

      {/* Lectures List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Day Schedule ({lectures.length} {lectures.length === 1 ? "lecture" : "lectures"})
          </span>
          {isCustom && onResetToDefault && (
            <button
              type="button"
              onClick={onResetToDefault}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Reset to Standard Timetable
            </button>
          )}
        </div>

        {lectures.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
            No lectures configured for this day. Click &quot;Add Lecture&quot; below to add one.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {lectures.map((lecture, index) => {
              const sub = subjects.find((s) => s.id === lecture.subjectId);
              return (
                <motion.div
                  key={`slot-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-[11px] font-black text-zinc-700 dark:text-zinc-300">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
                        {sub ? sub.name : lecture.subjectId}
                      </span>
                    </div>

                    {/* Reorder and Delete Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, -1)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Up"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={index === lectures.length - 1}
                        onClick={() => handleMove(index, 1)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Down"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLecture(index)}
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer"
                        title="Delete Lecture"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Subject Dropdown & Type Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                        Subject
                      </label>
                      <select
                        value={lecture.subjectId}
                        onChange={(e) => handleUpdateLecture(index, "subjectId", e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.type?.toUpperCase() || "THEORY"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                        Type
                      </label>
                      <div className="grid grid-cols-2 gap-1 bg-zinc-200/70 dark:bg-zinc-800 p-1 rounded-xl">
                        {["theory", "lab"].map((typeOption) => {
                          const active = (lecture.type || "theory").toLowerCase() === typeOption;
                          return (
                            <button
                              key={typeOption}
                              type="button"
                              onClick={() => handleUpdateLecture(index, "type", typeOption)}
                              className={`py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                                active
                                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                              }`}
                            >
                              {typeOption}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Direct Attendance Status Option (optional quick mark) */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                      Attendance Status For This Slot
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = lecture.status === opt.value;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => handleUpdateLecture(index, "status", opt.value)}
                            className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold text-center transition cursor-pointer ${
                              isSelected
                                ? `${opt.color} ring-2 ring-blue-500/30 scale-[1.02]`
                                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/40"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Add Lecture Button */}
        <button
          type="button"
          onClick={handleAddLecture}
          className="w-full py-2.5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:bg-blue-500/5 text-zinc-600 dark:text-zinc-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Another Lecture For This Day
        </button>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 cursor-pointer transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition active:scale-95 flex items-center gap-1.5"
        >
          <span>Save & Apply For Today</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
