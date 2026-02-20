import { NavLink } from "react-router-dom";
import { useMemo, useState } from "react";
import { useSemester } from "../context/SemesterContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const {
    semesters,
    currentSemesterId,
    setCurrentSemesterId,
    addSemester,
  } = useSemester();

  const [isSemesterMenuOpen, setIsSemesterMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const currentSemesterName = useMemo(
    () =>
      semesters.find((sem) => sem.id === currentSemesterId)?.name ||
      "Select semester",
    [semesters, currentSemesterId]
  );

  function handleAddSemester() {
    const semesterName = window.prompt("Enter semester name");
    if (!semesterName?.trim()) return;
    addSemester(semesterName);
    setIsSemesterMenuOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center px-4 sm:px-6 h-14">
        
        {/* ===== MOBILE TITLE (CENTERED) ===== */}
        <h1 className="sm:hidden absolute left-1/2 -translate-x-1/2 text-lg font-extrabold text-black dark:text-white font-[Poppins]">
          AttendanceManager
        </h1>

        {/* ===== DESKTOP TITLE ===== */}
        <h1 className="hidden sm:block text-2xl font-extrabold tracking-tight text-black dark:text-white font-[Poppins]">
          AttendanceManager
        </h1>

        {/* ===== DESKTOP SEMESTER SELECTOR ===== */}
        <div className="relative hidden sm:block ml-4">
          <button
            type="button"
            onClick={() => setIsSemesterMenuOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-sm font-medium min-w-40 inline-flex items-center justify-between gap-3"
          >
            <span className="truncate">{currentSemesterName}</span>
            <span className="text-xs">▾</span>
          </button>

          {isSemesterMenuOpen ? (
            <div className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
              {semesters.map((sem) => (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => {
                    setCurrentSemesterId(sem.id);
                    setIsSemesterMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition ${
                    sem.id === currentSemesterId
                      ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {sem.name}
                </button>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700" />
              <button
                type="button"
                onClick={handleAddSemester}
                className="w-full px-4 py-2 text-left text-sm text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                + Add new semester
              </button>
            </div>
          ) : null}
        </div>

        {/* ===== DESKTOP NAV ===== */}
        <nav className="hidden sm:flex items-center gap-4 ml-6">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/today">Detailed</NavItem>
          <NavItem to="/calendar">Calendar</NavItem>
        </nav>

        <div className="flex-1" />

        {/* ===== THEME TOGGLE (DESKTOP ONLY) ===== */}
        <button
          onClick={toggleTheme}
          className="
            hidden sm:flex
            relative w-14 h-7 rounded-full
            bg-gray-300 dark:bg-gray-700
            transition-colors duration-300
            cursor-pointer items-center
          "
        >
          <span
            className={`
              absolute left-1 top-1
              w-5 h-5 rounded-full bg-white
              flex items-center justify-center text-xs
              transition-all duration-300
              ${theme === "dark" ? "translate-x-7" : ""}
            `}
          >
            {theme === "dark" ? "🌙" : "🌞"}
          </span>
        </button>
      </div>
    </header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 cursor-pointer
        ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      `
      }
    >
      {children}
    </NavLink>
  );
}
