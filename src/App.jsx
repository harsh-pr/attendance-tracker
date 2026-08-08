import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Home from "./pages/Home";
import Today from "./pages/Today";
import Calendar from "./pages/Calendar";
import AiTimetable from "./pages/AiTimetable";

import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import ReminderScheduler from "./components/ReminderScheduler";
import LoadingScreen from "./components/LoadingScreen";
import Auth from "./pages/Auth";
import OnboardingSetup from "./pages/OnboardingSetup";

import { SemesterProvider, useSemester } from "./context/SemesterContext";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen
        items={[
          "Loading user session...",
          "Calculating attendance analytics...",
          "Syncing semester schedules...",
          "Preparing your workspace...",
        ]}
      />
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <SemesterProvider>
      <AppContent />
    </SemesterProvider>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<Today />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/timetable" element={<AiTimetable />} />
          <Route path="/ai-timetable" element={<Navigate to="/timetable" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const { semesters } = useSemester();
  const { user, logout } = useAuth();

  if (semesters.length === 0) {
    return <OnboardingSetup />;
  }

  return (
    <BrowserRouter>
      {/* Runs on every page — schedules reminder notifications globally */}
      <ReminderScheduler />

      <Navbar />
      <MobileNav />

      {user?.isGuest && (
        <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white text-[11px] font-extrabold px-3 py-1.5 backdrop-blur-md shadow-md flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-1.5 truncate">
            <span>🎭</span>
            <span className="truncate">
              Guest Demo Mode — Changes stored in temporary localStorage & cleared when tab is closed
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="ml-2 px-2.5 py-0.5 rounded-lg bg-black/30 hover:bg-black/50 text-white text-[10px] uppercase font-black tracking-wider cursor-pointer shrink-0 transition"
          >
            Exit Demo
          </button>
        </div>
      )}

      <main className={`${user?.isGuest ? "pt-24 sm:pt-28" : "pt-20"} pb-24 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300`}>
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}