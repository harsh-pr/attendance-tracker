import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const links = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/today", label: "Detailed", icon: "📊" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/ai-timetable", label: "Timetable", icon: "🗓️" },
];

export default function MobileNav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed bottom-4 left-3 right-3 sm:hidden z-40 max-w-md mx-auto h-15 rounded-full bg-white/85 dark:bg-zinc-900/85 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-2xl px-2.5 flex items-center justify-around">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className="relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer select-none py-1"
        >
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.88 }}
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 w-full h-full py-1.5 transition-colors duration-200 ${
                isActive
                  ? "text-blue-600 dark:text-white"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-dock-active-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs"
                />
              )}
              <span className="relative z-10 text-base leading-none">{link.icon}</span>
              <span className="relative z-10 text-[10px] font-extrabold tracking-tight">
                {link.label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}

      {/* Theme Toggle Pill */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={toggleTheme}
        type="button"
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer select-none"
        title="Toggle Theme"
      >
        <span className="text-base leading-none">{theme === "dark" ? "🌙" : "🌞"}</span>
        <span className="text-[10px] font-extrabold tracking-tight mt-0.5">
          {theme === "dark" ? "Dark" : "Light"}
        </span>
      </motion.button>
    </nav>
  );
}
