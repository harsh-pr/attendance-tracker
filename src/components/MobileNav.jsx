import { NavLink, useLocation } from "react-router-dom";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const links = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/today", label: "Detailed", icon: "📊" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/timetable", label: "Timetable", icon: "🗓️" },
];

export default function MobileNav() {
  const location = useLocation();
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [pillRect, setPillRect] = useState(null);

  const activePath = useMemo(() => {
    const path = location.pathname;
    if (path === "/ai-timetable") return "/timetable";
    const match = links.find((item) => item.to === path);
    return match ? match.to : null;
  }, [location.pathname]);

  useLayoutEffect(() => {
    function calculatePill() {
      if (!activePath) {
        setPillRect(null);
        return;
      }
      const activeEl = itemRefs.current[activePath];
      const containerEl = containerRef.current;
      if (!activeEl || !containerEl) return;

      const containerBox = containerEl.getBoundingClientRect();
      const activeBox = activeEl.getBoundingClientRect();

      setPillRect({
        left: activeBox.left - containerBox.left,
        width: activeBox.width,
      });
    }

    calculatePill();
    const rafId = requestAnimationFrame(calculatePill);
    window.addEventListener("resize", calculatePill);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", calculatePill);
    };
  }, [activePath]);

  return (
    <nav className="fixed bottom-4 left-3 right-3 sm:hidden z-40 max-w-md mx-auto h-16 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl px-2 flex items-center justify-between">
      <div ref={containerRef} className="relative flex items-center justify-around flex-1 h-full py-1.5">
        {/* Active Dock Pill Indicator - purely X-axis translation, locked to bottom dock */}
        {pillRect && (
          <motion.div
            className="absolute top-1.5 bottom-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs pointer-events-none"
            initial={false}
            animate={{
              x: pillRect.left,
              width: pillRect.width,
            }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 35,
            }}
            style={{
              left: 0,
            }}
          />
        )}

        {links.map((link) => {
          const isActive = activePath === link.to;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              ref={(el) => {
                if (el) itemRefs.current[link.to] = el;
              }}
              className="relative z-10 flex flex-col items-center justify-center flex-1 h-full cursor-pointer select-none py-1"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`relative z-10 flex flex-col items-center justify-center gap-0.5 w-full h-full py-1.5 transition-colors duration-200 ${
                  isActive
                    ? "text-blue-600 dark:text-white"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <span className="relative z-10 text-base leading-none">{link.icon}</span>
                <span className="relative z-10 text-[10px] font-extrabold tracking-tight">
                  {link.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>

      {/* Elegant Vertical Divider Line */}
      <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-700/80 my-auto mx-1 shrink-0 rounded-full" />

      {/* User's Theme Toggle Slider */}
      <div className="flex items-center justify-center pl-1 pr-1 shrink-0">
        <ThemeToggle />
      </div>
    </nav>
  );
}
