import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const SIZE_CLASSES = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  children,
  size = "md",
  showCloseButton = true,
  title,
  footer,
  noScroll = false,
}) {
  // Lock background body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle ESC key to dismiss with smooth swipe-down
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
          {/* Smooth Bottom Drawer / Drag-to-Dismiss Card */}
          <motion.div
            key="modal-sheet-card"
            onClick={(e) => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            dragSnapToOrigin={true}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 250) {
                onClose();
              }
            }}
            initial={{ y: "100%", opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{
              y: "100vh",
              opacity: 0,
              transition: {
                type: "tween",
                duration: 0.28,
                ease: [0.32, 0.72, 0, 1]
              }
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 32,
            }}
            className={`
              relative z-10 w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md}
              rounded-t-3xl sm:rounded-3xl
              bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100
              border border-zinc-200 dark:border-zinc-800
              p-4 sm:p-5 shadow-2xl
              max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden
              will-change-transform
            `}
          >
            {/* Functional Kokonut UI Drag-to-Dismiss Handle Bar */}
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-3 shrink-0 cursor-grab active:cursor-grabbing hover:bg-zinc-400 dark:hover:bg-zinc-500 transition-colors shadow-inner" />

            {/* Optional Header Title */}
            {title && (
              <div className="mb-3 pb-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
              </div>
            )}

            {/* Content Area - conditional scrolling */}
            <div className={`flex-1 ${noScroll ? "overflow-hidden" : "overflow-y-auto no-scrollbar"}`}>
              {children}
            </div>

            {/* Bottom Actions Footer */}
            {(showCloseButton || footer) && (
              <div className="mt-3.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  {footer}
                </div>
                {showCloseButton && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="
                      px-4 py-2 rounded-xl
                      bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200
                      text-xs font-bold shadow-sm
                      cursor-pointer transition-all duration-150 shrink-0 ml-auto
                    "
                  >
                    Close
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}