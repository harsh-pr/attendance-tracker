import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const links = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/today", label: "Detailed", icon: "📝" },
  { to: "/calendar", label: "Calendar", icon: "🗓️" },
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
              `flex flex-col items-center text-xs transition
               ${
                 isActive
                   ? "text-blue-600"
                   : "text-gray-500 dark:text-gray-400"
               }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}

        {/* ===== THEME TOGGLE (MOBILE ONLY, SINGLE SOURCE) ===== */}
        <div className="flex flex-col items-center">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
