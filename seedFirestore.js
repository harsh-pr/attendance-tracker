/**
 * seedFirestore.js
 * Run this ONCE to upload your local JSON data to Firestore.
 *
 * Usage (from project root):
 *   node seedFirestore.js
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, "data");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db      = admin.firestore();
const USER_ID = "default_user";

// ── READ JSON FILES ───────────────────────────────────────────────────────────
const subjectsJson   = JSON.parse(readFileSync(join(DATA_DIR, "subjects.json"),   "utf8"));
const timetablesJson = JSON.parse(readFileSync(join(DATA_DIR, "timetables.json"), "utf8"));
const remindersJson  = JSON.parse(readFileSync(join(DATA_DIR, "reminders.json"),  "utf8"));
const attendanceJson = JSON.parse(readFileSync(join(DATA_DIR, "attendance.json"), "utf8"));

// ── DERIVE DATA ───────────────────────────────────────────────────────────────
const subjectsBySemester   = subjectsJson.subjectsBySemester   || {};
const timetablesBySemester = timetablesJson.timetables         || {};
const remindersBySemester  = remindersJson.reminders           || {};
const attendanceSemesters  = attendanceJson.semesters          || [];

const semesterIds = Object.keys(subjectsBySemester);
const semesterStubs = semesterIds.map((id) => ({
  id,
  name: id.replace(/^sem(\d+)$/i, "Semester $1"),
}));
const currentSemesterId = attendanceJson.currentSemesterId || semesterStubs[0]?.id || "sem2";

// ── SEED ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting Firestore seed...\n");

  const batch = db.batch();

  // 1. META
  const metaRef = db.doc(`users/${USER_ID}/meta/app`);
  batch.set(metaRef, { currentSemesterId, semesters: semesterStubs });
  console.log(`✅ meta/app  →  currentSemesterId=${currentSemesterId}`);

  // 2. SUBJECTS
  const subjectsRef = db.doc(`users/${USER_ID}/subjects/data`);
  batch.set(subjectsRef, { data: subjectsBySemester });
  console.log(`✅ subjects/data  →  ${Object.keys(subjectsBySemester).join(", ")}`);

  // 3. TIMETABLES
  const timetablesRef = db.doc(`users/${USER_ID}/timetables/data`);
  batch.set(timetablesRef, { data: timetablesBySemester });
  console.log(`✅ timetables/data  →  ${Object.keys(timetablesBySemester).join(", ")}`);

  // 4. REMINDERS
  const remindersRef = db.doc(`users/${USER_ID}/reminders/data`);
  batch.set(remindersRef, { data: remindersBySemester });
  console.log(`✅ reminders/data  →  ${Object.keys(remindersBySemester).join(", ")}`);

  // 5. ATTENDANCE — import real records from attendance.json
  for (const sem of attendanceSemesters) {
    const records = sem.attendanceData || [];
    const attRef  = db.doc(`users/${USER_ID}/semesters/${sem.id}/attendance/data`);
    batch.set(attRef, { records });
    console.log(`✅ attendance/${sem.id}  →  ${records.length} days imported`);
  }

  // Ensure any semester not in attendance.json gets an empty record
  for (const sem of semesterStubs) {
    const alreadyHandled = attendanceSemesters.some((s) => s.id === sem.id);
    if (!alreadyHandled) {
      const attRef = db.doc(`users/${USER_ID}/semesters/${sem.id}/attendance/data`);
      batch.set(attRef, { records: [] }, { merge: true });
      console.log(`✅ attendance/${sem.id}  →  empty placeholder`);
    }
  }

  await batch.commit();
  console.log("\n🎉 Seed complete! Your attendance data is now in Firestore.");
  console.log("   Reload the app — all your data will be there.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});