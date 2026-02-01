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
      <div className="flex items-center gap-6 px-6 h-14">
        {/* App Title */}
        <h1
          className="
            text-2xl font-extrabold tracking-tight
            text-black dark:text-white
            font-[Poppins]
          "
        >
          AttendanceManager
        </h1>

        {/* Semester Selector */}
        <select
          value={currentSemesterId}
          onChange={(e) => setCurrentSemesterId(e.target.value)}
          className="
            px-3 py-1 rounded-lg text-sm
            bg-gray-100 dark:bg-gray-800
            border border-gray-300 dark:border-gray-700
            text-gray-900 dark:text-gray-100
            focus:outline-none
            cursor-pointer
          "
        >
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.name}
            </option>
          ))}
        </select>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-4 ml-4">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/today">Detailed</NavItem>
          <NavItem to="/calendar">Calendar</NavItem>
          <NavItem to="/stats">Stats</NavItem>
          <NavItem to="/settings">Settings</NavItem>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            relative w-14 h-7 rounded-full
            bg-gray-300 dark:bg-gray-700
            transition-colors duration-300
            cursor-pointer
            flex items-center
          "
          aria-label="Toggle theme"
        >
          {/* Slider */}
          <span
            className={`
              absolute left-1 top-1
              w-5 h-5 rounded-full
              bg-white
              flex items-center justify-center
              text-xs
              transition-all duration-300 ease-in-out
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
        transition-all duration-200
        cursor-pointer
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
