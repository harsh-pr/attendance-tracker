import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
          <Route path="/ai-timetable" element={<AiTimetable />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const { semesters } = useSemester();

  if (semesters.length === 0) {
    return <OnboardingSetup />;
  }

  return (
    <BrowserRouter>
      {/* Runs on every page — schedules reminder notifications globally */}
      <ReminderScheduler />

      <Navbar />
      <MobileNav />

      <main className="pt-20 pb-24 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}