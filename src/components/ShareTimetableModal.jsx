import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSemester } from "../context/SemesterContext";

// ── INLINE SVG ICONS ──────────────────────────────────────────────────────────
const Icons = {
  Share: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  Download: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Copy: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Check: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Clock: ({ className = "w-3 h-3" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Sparkles: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ShieldAlert: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  BookOpen: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Calendar: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Building2: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  ArrowRight: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  RefreshCw: ({ className = "w-4 h-4 animate-spin" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

export default function ShareTimetableModal({ isOpen, onClose }) {
  const {
    semesters,
    currentSemesterId,
    generateShareCodeForSemester,
    inspectSharedCode,
    importSharedTimetable,
  } = useSemester();

  const [activeTab, setActiveTab] = useState("share"); // 'share' | 'import'

  // ── SHARE STATE ─────────────────────────────────────────────────────────────
  const [sourceSemId, setSourceSemId] = useState(currentSemesterId || "");
  const [includeSubjects, setIncludeSubjects] = useState(true);
  const [includeTimetable, setIncludeTimetable] = useState(true);
  const [includeCollegeTimetable, setIncludeCollegeTimetable] = useState(false);

  const [generatedCodeData, setGeneratedCodeData] = useState(null); // { code, expiresAt }
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  // ── IMPORT STATE ────────────────────────────────────────────────────────────
  const [inputCode, setInputCode] = useState("");
  const [targetSemId, setTargetSemId] = useState(currentSemesterId || "");
  const [importMode, setImportMode] = useState("replace"); // 'replace' | 'merge'
  const [inspectedData, setInspectedData] = useState(null);

  const [isInspecting, setIsInspecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  // ── GENERATE CODE HANDLER ───────────────────────────────────────────────────
  const handleGenerateCode = async () => {
    setShareError("");
    setIsGenerating(true);
    try {
      if (!includeSubjects && !includeTimetable && !includeCollegeTimetable) {
        setShareError("Please select at least one item to share (Subjects, Timetable, or College Timetable).");
        setIsGenerating(false);
        return;
      }

      const res = await generateShareCodeForSemester({
        sourceSemesterId: sourceSemId || currentSemesterId,
        includeSubjects,
        includeTimetable,
        includeCollegeTimetable,
      });

      setGeneratedCodeData(res);
    } catch (err) {
      console.error(err);
      setShareError(err.message || "Failed to generate share code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCodeData?.code) return;
    navigator.clipboard.writeText(generatedCodeData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── INSPECT CODE HANDLER ────────────────────────────────────────────────────
  const handleInspectCode = async () => {
    if (!inputCode.trim()) {
      setImportError("Please enter a 6-character share code.");
      return;
    }
    setImportError("");
    setInspectedData(null);
    setIsInspecting(true);

    try {
      const data = await inspectSharedCode(inputCode);
      setInspectedData(data);
    } catch (err) {
      console.error(err);
      setImportError(err.message || "Invalid or expired share code.");
    } finally {
      setIsInspecting(false);
    }
  };

  // ── EXECUTE IMPORT HANDLER ──────────────────────────────────────────────────
  const handleExecuteImport = async () => {
    setImportError("");
    setIsImporting(true);
    try {
      await importSharedTimetable(inputCode, targetSemId || currentSemesterId, {
        mode: importMode,
      });

      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setImportError(err.message || "Failed to import timetable. The code may have expired or already been used.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Icons.Share className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Share & Import Timetable
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Single-use temporary timetable transfer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1.5 mx-6 mt-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50">
          <button
            onClick={() => {
              setActiveTab("share");
              setShareError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "share"
                ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Icons.Share className="w-3.5 h-3.5" />
            Share Timetable
          </button>

          <button
            onClick={() => {
              setActiveTab("import");
              setImportError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "import"
                ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Icons.Download className="w-3.5 h-3.5" />
            Import Timetable
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "share" ? (
              <motion.div
                key="share-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* 1. Semester Selector */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Select Semester to Share
                  </label>
                  <select
                    value={sourceSemId}
                    onChange={(e) => {
                      setSourceSemId(e.target.value);
                      setGeneratedCodeData(null);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.name} {sem.id === currentSemesterId ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Selection Options */}
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Select Items to Share:
                  </span>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeSubjects}
                      onChange={(e) => {
                        setIncludeSubjects(e.target.checked);
                        setGeneratedCodeData(null);
                      }}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
                    />
                    <Icons.BookOpen className="w-3.5 h-3.5 text-violet-500" />
                    <span>Subjects List (names, codes, targets)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeTimetable}
                      onChange={(e) => {
                        setIncludeTimetable(e.target.checked);
                        setGeneratedCodeData(null);
                      }}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
                    />
                    <Icons.Calendar className="w-3.5 h-3.5 text-violet-500" />
                    <span>Weekly Schedule (Mon - Fri time slots)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeCollegeTimetable}
                      onChange={(e) => {
                        setIncludeCollegeTimetable(e.target.checked);
                        setGeneratedCodeData(null);
                      }}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
                    />
                    <Icons.Building2 className="w-3.5 h-3.5 text-violet-500" />
                    <span>College Timetable Data (if imported)</span>
                  </label>
                </div>

                {shareError && (
                  <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                    {shareError}
                  </p>
                )}

                {/* Generate Button or Code Display */}
                {!generatedCodeData ? (
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Share Code...
                      </>
                    ) : (
                      <>
                        <Icons.Sparkles className="w-4 h-4" />
                        Generate One-Time Share Code
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        Your Unique Share Code
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Icons.Clock className="w-3 h-3" /> Expires in 24h
                      </span>
                    </div>

                    {/* Code Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-2xl font-black tracking-widest font-mono text-violet-600 dark:text-violet-400">
                        {generatedCodeData.code}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Icons.Check className="w-3.5 h-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Icons.Copy className="w-3.5 h-3.5" />
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-start gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <Icons.ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        Send this code to your friend. Once imported, this code will
                        automatically expire and be deleted from the database.
                      </span>
                    </div>

                    <button
                      onClick={() => setGeneratedCodeData(null)}
                      className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors pt-1 cursor-pointer"
                    >
                      Generate another code
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="import-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {/* 1. Enter Share Code */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Enter Friend's Share Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. K9X2A7"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.toUpperCase());
                        setInspectedData(null);
                        setImportError("");
                      }}
                      className="flex-1 px-3 py-2 text-sm uppercase font-mono font-semibold tracking-wider rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-400"
                    />
                    <button
                      onClick={handleInspectCode}
                      disabled={isInspecting || !inputCode.trim()}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isInspecting ? (
                        <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Inspect"
                      )}
                    </button>
                  </div>
                </div>

                {importError && (
                  <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                    {importError}
                  </p>
                )}

                {/* 2. Inspected Content Preview */}
                {inspectedData && (
                  <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-violet-900 dark:text-violet-200">
                        Code Verified!
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Shared by {inspectedData.sharedBy}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {inspectedData.payload?.includeSubjects && (
                        <span className="px-2 py-0.5 rounded-md bg-violet-600/15 text-violet-700 dark:text-violet-300 font-medium">
                          {inspectedData.payload?.subjects?.length || 0} Subjects
                        </span>
                      )}
                      {inspectedData.payload?.includeTimetable && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-medium">
                          Weekly Timetable Schedule
                        </span>
                      )}
                      {inspectedData.payload?.includeCollegeTimetable && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-600/15 text-blue-700 dark:text-blue-300 font-medium">
                          College Timetable Included
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Target Semester & Options */}
                {inspectedData && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Import Into Semester
                      </label>
                      <select
                        value={targetSemId}
                        onChange={(e) => setTargetSemId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none"
                      >
                        {semesters.map((sem) => (
                          <option key={sem.id} value={sem.id}>
                            {sem.name} {sem.id === currentSemesterId ? "(Current)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Import Action
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setImportMode("replace")}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-left cursor-pointer ${
                            importMode === "replace"
                              ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="font-bold">Replace Current</div>
                          <div className="text-[10px] opacity-75 font-normal">
                            Overwrites existing timetable
                          </div>
                        </button>

                        <button
                          onClick={() => setImportMode("merge")}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-left cursor-pointer ${
                            importMode === "merge"
                              ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="font-bold">Merge Subjects</div>
                          <div className="text-[10px] opacity-75 font-normal">
                            Adds new subjects only
                          </div>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleExecuteImport}
                      disabled={isImporting || importSuccess}
                      className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                          Importing & Consuming Code...
                        </>
                      ) : importSuccess ? (
                        <>
                          <Icons.Check className="w-4 h-4 text-emerald-400" />
                          Imported Successfully!
                        </>
                      ) : (
                        <>
                          <Icons.Download className="w-4 h-4" />
                          Import & Delete Code From Server
                          <Icons.ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
