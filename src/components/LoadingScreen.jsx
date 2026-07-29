import DynamicText from "./DynamicText";

export default function LoadingScreen({
  items = [
    "Loading user session...",
    "Calculating attendance analytics...",
    "Syncing semester schedules...",
    "Preparing your workspace...",
  ],
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <div className="text-center space-y-4 p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-xl max-w-sm w-full mx-4">
        <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75" />
        </div>

        <DynamicText
          items={items}
          interval={2000}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-300"
        />
      </div>
    </div>
  );
}
