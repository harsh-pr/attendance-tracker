import { useEffect, useLayoutEffect } from "react";
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser automatic scroll restoration so it doesn't fight route navigation
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    // Instantly scroll window and root containers to top on every route change
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

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
        onAnimationStart={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }}
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
      <ScrollToTop />
      {/* Runs on every page — schedules reminder notifications globally */}
      <ReminderScheduler />

      {/* PC-ONLY ULTRA-LIGHTWEIGHT STATIC DARK AMBIENT BACKGROUND (0% animation overhead) */}
      <div className="hidden lg:block pointer-events-none select-none fixed inset-0 z-0 overflow-hidden">
        {/* Deep Dark Ambient Base Canvas */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-950 transition-colors duration-500" />

        {/* Static Ambient Dark Radial Glows */}
        <div className="absolute -top-24 -left-20 w-[40rem] h-[40rem] bg-zinc-300/25 dark:bg-zinc-800/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-20 w-[42rem] h-[42rem] bg-zinc-400/20 dark:bg-zinc-800/30 rounded-full blur-[110px]" />

        {/* Geometric Grid / Dot Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_80%,transparent_100%)] opacity-40 dark:opacity-20" />
      </div>

      <Navbar />
      <MobileNav />

      <main className={`relative z-10 ${user?.isGuest ? "pt-24 sm:pt-28" : "pt-20"} pb-24 min-h-screen bg-zinc-50 dark:bg-zinc-950 lg:bg-transparent lg:dark:bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors duration-300`}>
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}