import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DynamicText({
  items = [
    "Loading your profile...",
    "Calculating attendance statistics...",
    "Syncing timetable schedule...",
    "Preparing workspace...",
  ],
  interval = 2200,
  className = "text-sm font-medium text-zinc-600 dark:text-zinc-300",
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [items, interval]);

  return (
    <div className="inline-flex items-center justify-center min-h-[28px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`flex items-center gap-2 ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{items[index]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
