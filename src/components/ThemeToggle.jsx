import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="
        relative w-14 h-7 rounded-full
        bg-zinc-200/90 dark:bg-zinc-800/90
        border border-zinc-300/80 dark:border-zinc-700/80
        shadow-inner backdrop-blur-md
        transition-colors duration-300
        cursor-pointer
        flex items-center p-0.5
        shrink-0
      "
    >
      {/* 60 FPS Spring Slider Knob */}
      <motion.span
        animate={{ x: isDark ? 28 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="
          w-5 h-5 rounded-full
          bg-white dark:bg-zinc-900
          border border-zinc-200 dark:border-zinc-700/60
          shadow-md
          flex items-center justify-center
          text-[11px] leading-none select-none
        "
      >
        {isDark ? "🌙" : "🌞"}
      </motion.span>
    </motion.button>
  );
}