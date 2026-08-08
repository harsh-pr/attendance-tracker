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
  const { user } = useAuth();

  if (semesters.length === 0) {
    return <OnboardingSetup />;
  }

  return (
    <BrowserRouter>
      {/* Runs on every page — schedules reminder notifications globally */}
      <ReminderScheduler />

      {/* PC-ONLY UNIQUE AMBIENT BACKGROUND (Strictly hidden on mobile for maximum speed) */}
      <div className="hidden lg:block pointer-events-none select-none fixed inset-0 z-0 overflow-hidden">
        {/* Dynamic Gradient Mesh Canvas */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-blue-50/20 to-indigo-50/30 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-950 transition-colors duration-300" />

        {/* Ambient Hardware-Accelerated Blobs */}
        <div className="animate-bg-float-1 transform-gpu absolute top-10 -left-20 w-[32rem] h-[32rem] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-600/15 dark:via-indigo-600/10 dark:to-purple-600/10 rounded-full blur-[140px]" />
        <div className="animate-bg-float-2 transform-gpu absolute bottom-10 -right-20 w-[34rem] h-[34rem] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-emerald-500/10 dark:from-indigo-600/10 dark:via-purple-600/10 dark:to-blue-600/10 rounded-full blur-[140px]" />

        {/* Geometric Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 dark:opacity-20" />
      </div>

      <Navbar />
      <MobileNav />

      <main className={`relative z-10 ${user?.isGuest ? "pt-24 sm:pt-28" : "pt-20"} pb-24 min-h-screen bg-zinc-50/90 dark:bg-zinc-950/90 text-zinc-900 dark:text-zinc-100 transition-colors duration-300`}>
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}