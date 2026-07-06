import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Today from "./pages/Today";
import Calendar from "./pages/Calendar";

import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import ReminderScheduler from "./components/ReminderScheduler";
import Auth from "./pages/Auth";
import OnboardingSetup from "./pages/OnboardingSetup";

import { SemesterProvider, useSemester } from "./context/SemesterContext";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
            Loading your profile…
          </p>
        </div>
      </div>
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

      <main className="pt-16 pb-20 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<Today />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}