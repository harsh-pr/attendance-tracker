# 📋 AttendanceManager

A modern, mobile-friendly attendance tracking web app built for college students. Track your subject-wise attendance, manage timetables, set reminders, and never fall below 75% again.

![AttendanceManager](https://img.shields.io/badge/React-18-blue?logo=react) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase) ![Tailwind](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

---

## ✨ Features

- **Subject-wise Attendance Tracking** — mark each lecture as Present, Absent, Free, or Cancelled
- **Timetable Management** — set your weekly timetable per semester, it auto-fills each day
- **Calendar View** — visual monthly calendar showing Full Day, Partial, Absent, Holiday, and Exam days
- **Multiple Semesters** — create, switch between, and delete semesters; copy subjects across semesters
- **Reminders** — schedule reminders with date and time, get browser notifications
- **Attendance Stats** — overall %, theory vs lab breakdown, subject-wise risk/safe status
- **Charts** — bar chart for last 7 days, overall attendance trend line chart
- **Export to PDF** — export monthly attendance summary as a PDF
- **Dark / Light Theme** — toggle with persistence across sessions
- **Firebase Sync** — all data stored in Firestore, persists across devices and reloads
- **PWA Ready** — installable on mobile via "Add to Home Screen"
- **Fully Responsive** — works on desktop and mobile with a bottom nav bar on mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Database | Firebase Firestore |
| Charts | Recharts |
| PDF Export | jsPDF + html2canvas |
| Deployment | Vercel |

---

## 📁 Project Structure

```
attendance-tracker/
├── public/
│   ├── favicon.png
│   ├── manifest.json
│   └── firebase-messaging-sw.js
├── src/
│   ├── components/
│   │   ├── AttendanceOverviewChart.jsx
│   │   ├── MobileNav.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   ├── OverallAttendanceModal.jsx
│   │   ├── QuickTodayAttendance.jsx
│   │   ├── ReminderScheduler.jsx
│   │   └── ThemeToggle.jsx
│   ├── context/
│   │   ├── SemesterContext.jsx
│   │   └── ThemeContext.jsx
│   ├── data/
│   │   ├── defaultSemesters.js
│   │   └── timetable.js
│   ├── firebase/
│   │   ├── config.js
│   │   └── firestoreService.js
│   ├── hooks/
│   │   ├── NotificationPermissionModal.jsx
│   │   └── useNotificationPermission.js
│   ├── pages/
│   │   ├── Calendar.jsx
│   │   ├── Home.jsx
│   │   └── Today.jsx
│   ├── store/
│   │   └── attendanceStore.js
│   ├── utils/
│   │   ├── attendanceUtils.js
│   │   └── timetableUtils.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── data/
│   ├── attendance.json
│   ├── reminders.json
│   ├── subjects.json
│   └── timetables.json
├── functions/
│   └── index.js
├── scripts/
│   ├── dev.js
│   └── splitAttendanceData.mjs
├── seedFirestore.js
├── vercel.json
├── index.html
└── .env
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- A Firebase project with Firestore enabled

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/attendance-tracker.git
cd attendance-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

Get these values from your Firebase Console → Project Settings.

### 4. Seed your data into Firestore (first time only)

Place your JSON files in the `data/` folder:
```
data/
├── attendance.json
├── subjects.json
├── timetables.json
└── reminders.json
```

Download your service account key from Firebase Console → Project Settings → Service Accounts → Generate new private key → save as `serviceAccountKey.json` in project root.

Install firebase-admin and run the seed script:
```bash
npm install firebase-admin
node seedFirestore.js
```

> ⚠️ Add `serviceAccountKey.json` to `.gitignore` immediately — never commit it.

### 5. Run the development server

```bash
npm run dev
```

---

## 🔥 Firebase Setup

### Firestore Structure

```
users/
└── default_user/
    ├── meta/
    │   └── app          → { currentSemesterId, semesters[] }
    ├── subjects/
    │   └── data         → { data: { sem2: [...] } }
    ├── timetables/
    │   └── data         → { data: { sem2: { monday: [...] } } }
    ├── reminders/
    │   └── data         → { data: { sem2: [...] } }
    └── semesters/
        └── sem2/
            └── attendance/
                └── data → { records: [...] }
```

### Firestore Rules

Set these rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> For production with multiple users, update rules to use authentication.

---

## 📦 Deployment

The app is deployed on Vercel. A `vercel.json` is included for SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

To deploy:
```bash
git add .
git commit -m "your message"
git push origin main
```

Vercel auto-deploys on every push to `main`.

Make sure to add all `.env` variables in your Vercel dashboard under Project → Settings → Environment Variables.

---

## 📱 PWA Installation

On mobile, open the app in Chrome/Safari and tap **"Add to Home Screen"** for an app-like experience with a custom icon.

---

## 🔔 Reminders

Reminders are scheduled via `setTimeout` when the app is open. For true background notifications (works even when browser is closed), Firebase Cloud Functions + FCM is set up in the `functions/` folder.

To deploy Cloud Functions:
```bash
firebase deploy --only functions
```

---

## 📊 Attendance Logic

- **Safe** — attendance ≥ 75%
- **Risk** — attendance < 75%
- **Conducted** — any lecture not marked as Cancelled
- **Attended** — lectures marked Present or Free
- Theory and Lab attendance are tracked separately

---

## 🙈 .gitignore

Make sure these are in your `.gitignore`:

```
node_modules/
.env
serviceAccountKey.json
dist/
```

---

## 📄 License

This project is for personal use. Feel free to fork and adapt it for your own college attendance tracking.

---

Built with ❤️ to survive the 75% attendance rule.