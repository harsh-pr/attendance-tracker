import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const links = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/today", label: "Detailed", icon: "📝" },
  { to: "/calendar", label: "Calendar", icon: "🗓️" },
  { to: "/ai-timetable", label: "Timetable", icon: "🏫" },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-700 sm:hidden z-40">
      <div className="flex justify-around items-center h-full">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs transition-colors duration-200
               ${
                 isActive
                   ? "text-blue-600 dark:text-blue-400 font-semibold"
                   : "text-gray-500 dark:text-gray-400"
               }`
            }
          >
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.82 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex flex-col items-center"
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}

        {/* ===== THEME TOGGLE (MOBILE ONLY) ===== */}
        <motion.div
          whileTap={{ scale: 0.85 }}
          className="flex flex-col items-center"
        >
          <ThemeToggle />
        </motion.div>
      </div>
    </nav>
  );
}
