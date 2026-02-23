import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Today from "./pages/Today";
import Calendar from "./pages/Calendar";

import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import ReminderScheduler from "./components/ReminderScheduler";

import { SemesterProvider } from "./context/SemesterContext";

export default function App() {
  return (
    <SemesterProvider>
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
    </SemesterProvider>
  );
}