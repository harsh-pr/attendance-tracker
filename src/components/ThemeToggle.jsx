import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative w-14 h-7 rounded-full
        bg-gray-300 dark:bg-gray-700
        transition-colors duration-300
        cursor-pointer
        flex items-center
      "
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
  );
}
