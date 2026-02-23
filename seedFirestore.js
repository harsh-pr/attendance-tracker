/**
 * seedFirestore.js
 * Run this ONCE to upload your local JSON data to Firestore.
 *
 * Usage (from project root):
 *   node seedFirestore.js
 *
 * Requirements:
 *   npm install firebase-admin
 *   Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path,
 *   OR replace the credential line below with:
 *     credential: admin.credential.cert(require('./serviceAccountKey.json'))
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CONFIG ────────────────────────────────────────────────────────────────────
// Option A: set env var GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
// Option B: uncomment and point to your file directly:
// import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // credential: admin.credential.cert(serviceAccount),  // ← Option B
});

const db = admin.firestore();
const USER_ID = "default_user";

// ── READ YOUR JSON FILES ──────────────────────────────────────────────────────
// Adjust paths if your data folder is in a different location
const DATA_DIR = __dirname; // or wherever your json files live

const subjectsJson   = JSON.parse(readFileSync(join(DATA_DIR, "subjects.json"),   "utf8"));
const timetablesJson = JSON.parse(readFileSync(join(DATA_DIR, "timetables.json"), "utf8"));
const remindersJson  = JSON.parse(readFileSync(join(DATA_DIR, "reminders.json"),  "utf8"));

// ── DERIVE SEMESTER LIST FROM SUBJECTS ───────────────────────────────────────
// subjects.json shape: { subjectsBySemester: { sem2: [...] } }
const subjectsBySemester = subjectsJson.subjectsBySemester || {};
const semesterIds = Object.keys(subjectsBySemester);

const semesterStubs = semesterIds.map((id) => ({
  id,
  // Capitalise "sem2" → "Semester 2" for display, adjust if you want custom names
  name: id.replace(/^sem(\d+)$/i, "Semester $1"),
}));

const currentSemesterId = semesterStubs[0]?.id ?? "sem2";

// ── TIMETABLES ────────────────────────────────────────────────────────────────
// timetables.json shape: { timetables: { sem2: { monday: [...], ... } } }
const timetablesBySemester = timetablesJson.timetables || {};

// ── REMINDERS ─────────────────────────────────────────────────────────────────
// reminders.json shape: { reminders: { sem2: [...] } }
const remindersBySemester = remindersJson.reminders || {};

// ── WRITE TO FIRESTORE ────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting Firestore seed...\n");

  const batch = db.batch();

  // 1. META — semester list + current semester
  const metaRef = db.doc(`users/${USER_ID}/meta/app`);
  batch.set(metaRef, {
    currentSemesterId,
    semesters: semesterStubs,
  });
  console.log(`✅ meta/app  →  currentSemesterId=${currentSemesterId}, semesters=[${semesterStubs.map(s=>s.id).join(", ")}]`);

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

  // 5. ATTENDANCE — create empty records for each semester so the app
  //    recognises them as "known" (you can skip if you have existing attendance)
  for (const sem of semesterStubs) {
    const attRef = db.doc(`users/${USER_ID}/semesters/${sem.id}/attendance/data`);
    // Only set if not already there (merge:true won't overwrite existing records)
    batch.set(attRef, { records: [] }, { merge: true });
    console.log(`✅ attendance/${sem.id}  →  empty placeholder (existing data kept)`);
  }

  await batch.commit();
  console.log("\n🎉 Seed complete! Your data is now in Firestore.");
  console.log("   You can now reload the app — it will read from Firebase instead of resetting.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});