import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"             // ← prevents accidental form submission
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="
        relative w-14 h-7 rounded-full
        bg-gray-300 dark:bg-gray-700
        transition-colors duration-300
        cursor-pointer
        flex items-center
        shrink-0
      "
    >
      {/* Slider knob */}
      <span
        className={`
          absolute left-1 top-1
          w-5 h-5 rounded-full
          bg-white shadow-sm
          flex items-center justify-center
          text-xs leading-none select-none
          transition-transform duration-300 ease-in-out
          ${theme === "dark" ? "translate-x-7" : "translate-x-0"}
        `}
      >
        {theme === "dark" ? "🌙" : "🌞"}
      </span>
    </button>
  );
}