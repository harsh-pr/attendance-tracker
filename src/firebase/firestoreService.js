// src/firebase/firestoreService.js
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./config";

const USER_ID = "default_user";

function metaRef() {
  return doc(db, "users", USER_ID, "meta", "app");
}
function subjectsRef() {
  return doc(db, "users", USER_ID, "subjects", "data");
}
function timetablesRef() {
  return doc(db, "users", USER_ID, "timetables", "data");
}
function remindersRef() {
  return doc(db, "users", USER_ID, "reminders", "data");
}
function attendanceRef(semesterId) {
  return doc(db, "users", USER_ID, "semesters", semesterId, "attendance", "data");
}

// ─── LOAD ALL DATA ────────────────────────────────────────────────────────────
export async function loadAllData() {
  const [metaSnap, subjectsSnap, timetablesSnap, remindersSnap] =
    await Promise.all([
      getDoc(metaRef()),
      getDoc(subjectsRef()),
      getDoc(timetablesRef()),
      getDoc(remindersRef()),
    ]);

  const meta = metaSnap.exists() ? metaSnap.data() : null;

  // No meta doc = Firestore is empty, first time use
  if (!meta) {
    console.log("[Firestore] No meta found — first time use");
    return null;
  }

  const subjectsDoc   = subjectsSnap.exists()   ? subjectsSnap.data()   : {};
  const timetablesDoc = timetablesSnap.exists()  ? timetablesSnap.data() : {};
  const remindersDoc  = remindersSnap.exists()   ? remindersSnap.data()  : {};

  console.log("[Firestore] meta:", meta);
  console.log("[Firestore] subjectsDoc keys:", Object.keys(subjectsDoc));
  console.log("[Firestore] timetablesDoc keys:", Object.keys(timetablesDoc));
  console.log("[Firestore] remindersDoc keys:", Object.keys(remindersDoc));

  const semesterStubs = meta.semesters || [];

  // Load attendance per semester
  const attendanceResults = await Promise.all(
    semesterStubs.map(async (sem) => {
      const snap = await getDoc(attendanceRef(sem.id));
      const records = snap.exists() ? (snap.data().records || []) : [];
      console.log(`[Firestore] attendance for ${sem.id}: ${records.length} days`);
      return { semId: sem.id, attendanceData: records };
    })
  );

  const semesters = semesterStubs.map((sem) => {
    const found = attendanceResults.find((r) => r.semId === sem.id);
    return { ...sem, attendanceData: found ? found.attendanceData : [] };
  });

  // Handle both possible structures the migration may have written:
  // Old migration: { data: { sem2: [...] } }  → we read subjectsDoc.data
  // New app saves: { data: { sem2: [...] } }   → same
  const subjectsBySemester   = subjectsDoc.data   || subjectsDoc.subjectsBySemester || {};
  const timetablesBySemester = timetablesDoc.data  || timetablesDoc.timetables       || {};
  const remindersBySemester  = remindersDoc.data   || remindersDoc.reminders          || {};

  console.log("[Firestore] subjectsBySemester sems:", Object.keys(subjectsBySemester));
  console.log("[Firestore] timetablesBySemester sems:", Object.keys(timetablesBySemester));
  console.log("[Firestore] remindersBySemester sems:", Object.keys(remindersBySemester));

  return {
    currentSemesterId: meta.currentSemesterId,
    semesters,
    subjectsBySemester,
    timetablesBySemester,
    remindersBySemester,
  };
}

// ─── SAVE META ────────────────────────────────────────────────────────────────
export async function saveMeta(currentSemesterId, semesters) {
  const semesterStubs = semesters.map(({ id, name }) => ({ id, name }));
  await setDoc(metaRef(), { currentSemesterId, semesters: semesterStubs });
}

// ─── SAVE ATTENDANCE ─────────────────────────────────────────────────────────
export async function saveAttendance(semesterId, attendanceData) {
  await setDoc(attendanceRef(semesterId), { records: attendanceData || [] });
}

// ─── SAVE SUBJECTS ────────────────────────────────────────────────────────────
export async function saveSubjects(subjectsBySemester) {
  await setDoc(subjectsRef(), { data: subjectsBySemester });
}

// ─── SAVE TIMETABLES ─────────────────────────────────────────────────────────
export async function saveTimetables(timetablesBySemester) {
  await setDoc(timetablesRef(), { data: timetablesBySemester });
}

// ─── SAVE REMINDERS ──────────────────────────────────────────────────────────
export async function saveReminders(remindersBySemester) {
  await setDoc(remindersRef(), { data: remindersBySemester });
}