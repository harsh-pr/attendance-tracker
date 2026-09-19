import { useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";

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
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/today" element={<Today />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/timetable" element={<AiTimetable />} />
        <Route path="/ai-timetable" element={<Navigate to="/timetable" replace />} />
      </Routes>
    </motion.div>
  );
}

function AmbientBackground() {
  return (
    <div className="hidden lg:block pointer-events-none select-none fixed inset-0 z-0 overflow-hidden">
      {/* ================= DARK THEME GRID BACKGROUND ================= */}
      <div className="hidden dark:block absolute inset-0 bg-[#000000] transition-colors duration-300">
        <div className="absolute inset-0 bg-[#000000]" />
        {/* Subtle Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff07_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_70%,transparent_100%)] opacity-80" />
      </div>

      {/* ================= LIGHT THEME GRID BACKGROUND ================= */}
      <div className="block dark:hidden absolute inset-0 bg-[#f8fafc] transition-colors duration-300">
        <div className="absolute inset-0 bg-[#f8fafc]" />
        {/* Clean Blueprint Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_70%,transparent_100%)] opacity-80" />
      </div>
    </div>
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

      {/* Responsive Ambient Canvas Background */}
      <AmbientBackground />

      <Navbar />
      <MobileNav />

      <main className={`relative z-10 ${user?.isGuest ? "pt-24 sm:pt-28" : "pt-20"} pb-24 min-h-screen bg-slate-50 dark:bg-black lg:bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors duration-200`}>
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}