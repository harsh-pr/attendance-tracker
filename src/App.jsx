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
        {/* Dynamic Gradient Mesh Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-100/50 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-950 transition-colors duration-500" />

        {/* Top-Left Blue/Indigo Neon Orb */}
        <div className="animate-bg-float-1 transform-gpu absolute -top-20 -left-20 w-[40rem] h-[40rem] bg-gradient-to-tr from-blue-500/25 via-indigo-500/20 to-purple-500/20 dark:from-blue-600/30 dark:via-indigo-600/25 dark:to-purple-600/20 rounded-full blur-[100px]" />

        {/* Top-Right Emerald/Teal Accent Orb */}
        <div className="animate-bg-float-2 transform-gpu absolute -top-16 -right-16 w-[36rem] h-[36rem] bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-blue-500/15 dark:from-emerald-600/20 dark:via-teal-600/20 dark:to-blue-600/15 rounded-full blur-[100px]" />

        {/* Bottom-Right Violet/Pink Orb */}
        <div className="animate-bg-float-1 transform-gpu absolute -bottom-32 -right-20 w-[42rem] h-[42rem] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/15 dark:from-indigo-600/25 dark:via-purple-600/25 dark:to-blue-600/20 rounded-full blur-[110px]" />

        {/* Center Blue Glow */}
        <div className="animate-bg-float-2 transform-gpu absolute top-1/3 left-1/3 w-[30rem] h-[30rem] bg-blue-500/15 dark:bg-blue-600/20 rounded-full blur-[120px]" />

        {/* Geometric Grid / Dot Overlay with Radial Falloff */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 dark:opacity-40" />
      </div>

      <Navbar />
      <MobileNav />

      <main className={`relative z-10 ${user?.isGuest ? "pt-24 sm:pt-28" : "pt-20"} pb-24 min-h-screen bg-zinc-50 dark:bg-zinc-950 lg:bg-transparent lg:dark:bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors duration-300`}>
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}