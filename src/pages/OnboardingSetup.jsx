// src/pages/OnboardingSetup.jsx
import { useState } from "react";
import { useSemester } from "../context/SemesterContext";
import { DEFAULT_SEMESTERS } from "../data/defaultSemesters";
import { useAuth } from "../context/AuthContext";

export default function OnboardingSetup() {
  const { addSemester } = useSemester();
  const { logout } = useAuth();
  const [semesterName, setSemesterName] = useState("Semester 1");
  const [useDefaults, setUseDefaults] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = semesterName.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const subjects = useDefaults ? DEFAULT_SEMESTERS[0].subjects : [];
      await addSemester(trimmed, { subjects });
    } catch (err) {
      console.error("Failed to setup first semester:", err);
      alert("Failed to initialize semester. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-gray-100 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/60 shadow-2xl rounded-3xl backdrop-blur-xl p-8 transform-gpu transition-all duration-300 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_20px_50px_rgba(30,58,138,0.3)]">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl shadow-lg shadow-blue-500/35 mb-3">
            A
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600">Attendance Tracker</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Let's set up your very first semester to get started.
          </p>
        </div>

        {/* SETUP FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Semester Name
            </label>
            <input
              type="text"
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-600/40 transition duration-200 font-medium"
              placeholder="e.g. Semester 1, Semester 3"
              required
            />
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20">
            <input
              type="checkbox"
              id="useDefaults"
              checked={useDefaults}
              onChange={(e) => setUseDefaults(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
            />
            <label htmlFor="useDefaults" className="text-xs text-gray-600 dark:text-gray-300 leading-normal cursor-pointer select-none">
              <span className="font-bold block text-gray-800 dark:text-white mb-0.5">Pre-populate subjects</span>
              Automatically load default subjects (Python, Graphics, SS & CS, etc.) to get you started quickly.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            Let's Go!
          </button>
        </form>

        {/* LOGOUT FOOTER */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            🚪 Log Out of Account
          </button>
        </div>

      </div>
    </div>
  );
}
