import { NavLink } from "react-router-dom";
import { useSemester } from "../context/SemesterContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const {
    semesters,
    currentSemesterId,
    setCurrentSemesterId,
  } = useSemester();

  const { theme, toggleTheme } = useTheme();

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
        <select
          value={currentSemesterId}
          onChange={(e) => setCurrentSemesterId(e.target.value)}
          className="
            hidden sm:block ml-4
            px-3 py-1 rounded-lg text-sm
            bg-gray-100 dark:bg-gray-800
            border border-gray-300 dark:border-gray-700
            text-gray-900 dark:text-gray-100
            cursor-pointer
          "
        >
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.name}
            </option>
          ))}
        </select>

        {/* ===== DESKTOP NAV ===== */}
        <nav className="hidden sm:flex items-center gap-4 ml-6">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/today">Detailed</NavItem>
          <NavItem to="/calendar">Calendar</NavItem>
          <NavItem to="/stats">Stats</NavItem>
          <NavItem to="/settings">Settings</NavItem>
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
