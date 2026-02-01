import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, children }) {
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
        className="
          relative z-10
          w-full max-w-lg mx-4
          rounded-2xl
          bg-white dark:bg-gray-900
          p-6 shadow-2xl
          animate-[modalIn_0.25s_ease-out]
        "
      >
        {children}

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
      </div>
    </div>,
    document.body
  );
}
