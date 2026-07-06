// src/components/NotificationPermissionModal.jsx
import Modal from "../components/Modal";

export default function NotificationPermissionModal({ open, onAllow, onDismiss }) {
  return (
    <Modal open={open} onClose={onDismiss} size="md" showCloseButton={false}>
      <div className="text-gray-900 dark:text-gray-100 space-y-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 mx-auto">
          <span className="text-3xl">🔔</span>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold">Enable Notifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Allow notifications so your reminders alert you at the right time,
            even when the app isn't open.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            Not now
          </button>
          <button
            onClick={onAllow}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all"
          >
            Allow notifications
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          You can change this anytime in your browser settings.
        </p>
      </div>
    </Modal>
  );
}