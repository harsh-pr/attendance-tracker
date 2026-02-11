import { useEffect } from "react";
import { createPortal } from "react-dom";

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

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        className={`
          relative z-10
          w-full mx-4 ${SIZE_CLASSES[size] || SIZE_CLASSES.md}
          rounded-2xl
          bg-white dark:bg-gray-900
          p-6 shadow-2xl
          animate-[modalIn_0.25s_ease-out]
        `}
      >
        {children}

        {showCloseButton && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="
                px-4 py-2 rounded-lg
                bg-gray-900 text-white
                dark:bg-white dark:text-black
                cursor-pointer

                transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-lg
                active:scale-95
              "
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}