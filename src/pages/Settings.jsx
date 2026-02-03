export default function Settings() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Attendance data is saved to the server immediately when you update a
          lecture.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Sync status
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Your attendance updates are stored on the server right away and will
          be restored automatically after reloads or crashes.
        </p>
      </div>
    </div>
  );
}
