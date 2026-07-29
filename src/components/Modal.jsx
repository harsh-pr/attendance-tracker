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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Smooth Bottom Drawer / Drag-to-Dismiss Card */}
          <motion.div
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
            exit={{ y: "100%", opacity: 0 }}
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
              p-5 sm:p-6 shadow-2xl
              max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden
              will-change-transform
            `}
          >
            {/* Functional Kokonut UI Drag-to-Dismiss Handle Bar */}
            <div className="w-16 h-2 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-4 shrink-0 cursor-grab active:cursor-grabbing hover:bg-zinc-400 dark:hover:bg-zinc-500 transition-colors shadow-inner" />

            {/* Optional Header Title */}
            {title && (
              <div className="mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto pr-1 flex-1">
              {children}
            </div>

            {/* Bottom Actions Footer */}
            {showCloseButton && (
              <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="
                    px-5 py-2.5 rounded-xl
                    bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200
                    text-xs font-bold shadow-sm
                    cursor-pointer transition-all duration-150
                  "
                >
                  Close
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}