import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function HoldButton({
  onConfirm,
  holdDuration = 1500, // milliseconds
  children = "Hold to confirm",
  icon = "🗑️",
  variant = "danger",
  className = "",
  type = "button",
}) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  const startHold = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(100, (elapsed / holdDuration) * 100);
      setProgress(currentProgress);

      if (elapsed >= holdDuration) {
        setIsHolding(false);
        setProgress(0);
        if (onConfirm) onConfirm();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelHold = () => {
    setIsHolding(false);
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const variantStyles = {
    danger: {
      bg: "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-500/15",
      fill: "bg-red-500/40 dark:bg-red-600/50",
    },
    warning: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-500/15",
      fill: "bg-amber-500/40 dark:bg-amber-600/50",
    },
    primary: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-500/15",
      fill: "bg-blue-500/40 dark:bg-blue-600/50",
    },
    default: {
      bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/70",
      fill: "bg-zinc-300 dark:bg-zinc-600",
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.danger;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type={type}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className={`
        relative overflow-hidden select-none cursor-pointer
        px-3.5 py-2 rounded-xl border text-xs font-semibold
        inline-flex items-center justify-between gap-2.5 transition-colors
        ${currentVariant.bg}
        ${className}
      `}
    >
      {/* Background Fill Progress Bar */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${currentVariant.fill}`}
        style={{ width: `${progress}%` }}
        transition={{ ease: "linear", duration: 0.05 }}
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-1.5 shrink-0">
        {icon && <span className="text-xs leading-none">{icon}</span>}
        <span className="font-bold">{children}</span>
      </span>

      <span className="relative z-10 text-[10px] font-mono opacity-85 px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 shrink-0 whitespace-nowrap ml-auto">
        {isHolding ? `${Math.round(progress)}%` : `Hold ${(holdDuration / 1000).toFixed(1)}s`}
      </span>
    </motion.button>
  );
}
