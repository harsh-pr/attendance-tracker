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
}) {
  // Lock background scroll
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
            }}
            className={`
              relative z-10
              w-full mx-4 ${SIZE_CLASSES[size] || SIZE_CLASSES.md}
              rounded-2xl
              bg-white dark:bg-gray-900
              p-6 shadow-2xl
            `}
          >
            {children}

            {showCloseButton && (
              <div className="mt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03, translateY: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="
                    px-4 py-2 rounded-lg
                    bg-gray-900 text-white
                    dark:bg-white dark:text-black
                    cursor-pointer
                    shadow-md hover:shadow-lg
                    transition-colors duration-200
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