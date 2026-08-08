# 📚 AttendanceManager

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Cloud-FFCA28?style=for-the-badge&logo=firebase)
![Google Auth](https://img.shields.io/badge/Google-Authentication-4285F4?style=for-the-badge&logo=google)
![Firestore](https://img.shields.io/badge/Firestore-Database-FFCA28?style=for-the-badge&logo=firebase)
![Recharts](https://img.shields.io/badge/Recharts-Analytics-8884D8?style=for-the-badge)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=for-the-badge&logo=framer)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Responsive](https://img.shields.io/badge/Responsive-Mobile%20Friendly-success?style=for-the-badge)

A modern, responsive attendance management web application built with **React**, **Firebase**, and **Tailwind CSS** to help college students effortlessly track attendance, monitor 75% eligibility criteria, and stay organized throughout the semester.

</div>

---

## ✨ Key Features

### 🎭 Guest / Demo Mode *(New)*
- **Instant Feature Testing**: Try out all features without creating an account.
- **Temporary Storage**: All demo data is stored in browser `localStorage`.
- **Auto Cleanup**: All guest data is automatically cleared once the browser tab/session is closed.
- **Welcome Notice Modal**: Detailed instructions explaining guest session mechanics upon login.

---

### 📅 Attendance Tracking
- **Multiple Attendance Statuses**:
  - ✅ **Present**
  - ❌ **Absent**
  - 🟢 **Free Lecture**
  - ⚪ **Cancelled Lecture**
- **Automatic Calculation**: Real-time updates on overall and subject-wise percentages.
- **Daily Attendance Logging**: Record, backfill, and edit past dates easily.

---

### 🎯 75% Attendance Criterion Calculator
- **Eligibility Indicator**: Displays real-time status (Safe Zone vs. Risk Zone).
- **Required Classes Math**: Calculates exactly how many upcoming lectures to attend to reach 75%.
- **Bunk Calculator**: Calculates how many upcoming lectures can be safely skipped while staying above 75%.

---

### 📊 Attendance Analytics & Dashboard
- **Interactive Recharts**: 7-day attendance trends and lecture history.
- **Executive Header**: Real-time status indicators and course breakdowns.
- **Subject Cards**: Separate progress bars for Theory and Lab subjects.

---

### 📆 Timetable Management & Sharing *(New)*
- **Weekly Class Schedule**: Drag-free lecture slot assignment with breaks and room numbers.
- **Semester Structure Editor**: Customize time slots, recess/lunch breaks, and active weekdays.
- **Timetable Sharing Modal**: Share weekly class schedules instantly via custom link or copy formats.

---

### 🗓 Attendance Calendar & PDF Reports
- **Semester Calendar**: Full Day, Partial, Absent, Holiday, and Exam Day pattern tracking.
- **PDF Export**: Generate printable PDF monthly attendance reports with calendar grids and summary tables.
- **Quick Backfill**: Batch update attendance for past days.

---

### 🔔 Smart Reminders & Notifications
- **Global Scheduler**: Schedule lecture reminders and browser notifications.
- **Permission Modal**: Integrated browser permission prompt for alerts.

---

### ☁ Cloud Sync & Security
- **Firebase Authentication**: Email/Password login and Google One-Tap/Popup sign-in.
- **Cloud Firestore**: Real-time cloud sync across desktop and mobile devices.
- **Account Auto-Cleanup**: Hold-to-confirm account deletion and Firestore orphan cleaner script (`npm run clean-orphans`).

---

### ⚡ Performance & Stealth Design *(New)*
- **0% Animation Overhead**: Hardware-optimized static dark ambient background on PC.
- **Lag-Free Theme Switcher**: 60fps instant light/dark mode transition on mobile & PC.
- **Dark Ambient Stealth Theme**: Executive dark aesthetic without heavy neon color tints.
- **Zero-Scroll Auth Layout**: Compact responsive authentication card that stays fixed without page scrollbars.

---

# 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Frontend UI Library |
| **Vite 7** | Fast Build Tool & Dev Server |
| **Firebase Auth** | Google & Email Authentication |
| **Cloud Firestore** | Real-time Database |
| **Framer Motion** | Fluid Component Animations |
| **Tailwind CSS** | Custom Design System & Responsive Layouts |
| **Recharts** | Data Analytics & Charts |
| **jsPDF & html2canvas** | PDF Report Generation |

---

# 📂 Project Structure

```text
src/
│
├── components/
│   ├── AttendanceOverviewChart.jsx
│   ├── DynamicText.jsx
│   ├── HoldButton.jsx
│   ├── LoadingScreen.jsx
│   ├── MobileNav.jsx
│   ├── Modal.jsx
│   ├── Navbar.jsx
│   ├── NotificationPermissionModal.jsx
│   ├── OverallAttendanceModal.jsx
│   ├── QuickBackfillModal.jsx
│   ├── QuickTodayAttendance.jsx
│   ├── ReminderScheduler.jsx
│   ├── ShareTimetableModal.jsx
│   ├── SubjectCalendarModal.jsx
│   └── ThemeToggle.jsx
│
├── pages/
│   ├── AiTimetable.jsx
│   ├── Auth.jsx
│   ├── Calendar.jsx
│   ├── Home.jsx
│   ├── OnboardingSetup.jsx
│   └── Today.jsx
│
├── context/
│   ├── AuthContext.jsx
│   ├── SemesterContext.jsx
│   └── ThemeContext.jsx
│
├── firebase/
│   ├── config.js
│   └── firestoreService.js
│
├── store/
│   └── attendanceStore.js
│
└── utils/
    ├── attendanceUtils.js
    └── timetableUtils.js
```

---

# 📸 Application Screenshots

### 🔐 Authentication & Guest Mode

---

### 🏠 Dashboard (Light & Dark Theme)

---

### 📊 Attendance Analytics & Graph

---

### 📚 Subject-wise Attendance & Details

---

### 📅 Subject Attendance History Calendar

---

### ⚡ Quick Today's Attendance

---

### 🗓 Attendance Calendar & Highlights

---

### 📄 Monthly PDF Report

---

### ⚙ Timetable Management & Sharing

---

# 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/harsh-pr/attendance-tracker.git
```

### 2. Navigate to the project directory
```bash
cd attendance-tracker
```

### 3. Install dependencies
```bash
npm install
```

### 4. Configure Firebase
Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Start the development server
```bash
npm run dev
```

---

# 🧹 Database Maintenance

### Purge Orphan Data of Deleted Users
When deleting users from the Firebase Authentication Dashboard, run the orphan cleanup script to automatically delete residual Firestore documents:

```bash
npm run clean-orphans
```

---

# 📱 Responsive Design

Optimized for:
- 💻 **Desktop & Laptops**: Split showcase layout & static dark ambient canvas
- 📱 **Mobile Devices**: Touch-first navigation & 60fps lag-free theme toggle
- 📟 **Tablets**: Fluid grid scaling & responsive modals

---

### ⭐ If you found this project helpful, give it a star on GitHub!