// src/firebase/firestoreService.js
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "./config";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
// All data lives under a single user document.
// If you add auth later, replace USER_ID with the real UID.
const USER_ID = "default_user";

// Firestore paths:
//   users/{userId}/meta/app         → currentSemesterId, list of semester stubs
//   users/{userId}/subjects/data    → subjectsBySemester
//   users/{userId}/timetables/data  → timetablesBySemester
//   users/{userId}/reminders/data   → remindersBySemester
//   users/{userId}/semesters/{semId}/attendance/data  → attendanceData for that semester

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function userRef() {
  return doc(db, "users", USER_ID);
}

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
/**
 * Load everything from Firestore in parallel.
 * Returns { currentSemesterId, semesters, subjectsBySemester, timetablesBySemester, remindersBySemester }
 */
export async function loadAllData() {
  const [metaSnap, subjectsSnap, timetablesSnap, remindersSnap] =
    await Promise.all([
      getDoc(metaRef()),
      getDoc(subjectsRef()),
      getDoc(timetablesRef()),
      getDoc(remindersRef()),
    ]);

  const meta = metaSnap.exists() ? metaSnap.data() : null;
  const subjectsDoc = subjectsSnap.exists() ? subjectsSnap.data() : {};
  const timetablesDoc = timetablesSnap.exists() ? timetablesSnap.data() : {};
  const remindersDoc = remindersSnap.exists() ? remindersSnap.data() : {};

  // If no data in Firestore yet, return null so SemesterContext uses defaults
  if (!meta) {
    return null;
  }

  const semesterStubs = meta.semesters || [];

  // Load attendance for each semester in parallel
  const attendanceResults = await Promise.all(
    semesterStubs.map(async (sem) => {
      const snap = await getDoc(attendanceRef(sem.id));
      return {
        semId: sem.id,
        attendanceData: snap.exists() ? snap.data().records || [] : [],
      };
    })
  );

  // Merge attendance into semester stubs
  const semesters = semesterStubs.map((sem) => {
    const found = attendanceResults.find((r) => r.semId === sem.id);
    return {
      ...sem,
      attendanceData: found ? found.attendanceData : [],
    };
  });

  return {
    currentSemesterId: meta.currentSemesterId,
    semesters,
    subjectsBySemester: subjectsDoc.data || {},
    timetablesBySemester: timetablesDoc.data || {},
    remindersBySemester: remindersDoc.data || {},
  };
}

// ─── SAVE META (semester list + active semester) ──────────────────────────────
export async function saveMeta(currentSemesterId, semesters) {
  // Only store lightweight stubs in meta (no attendanceData)
  const semesterStubs = semesters.map(({ id, name }) => ({ id, name }));
  await setDoc(metaRef(), { currentSemesterId, semesters: semesterStubs });
}

// ─── SAVE ATTENDANCE (per-semester) ──────────────────────────────────────────
/**
 * Save attendance for a single semester.
 * Called whenever attendanceData for that semester changes.
 */
export async function saveAttendance(semesterId, attendanceData) {
  await setDoc(attendanceRef(semesterId), { records: attendanceData || [] });
}

// ─── SAVE ALL ATTENDANCE (batch) ─────────────────────────────────────────────
/**
 * Save attendance for ALL semesters at once.
 * Used when semesters array changes structurally (add/delete semester).
 */
export async function saveAllAttendance(semesters) {
  await Promise.all(
    semesters.map((sem) =>
      setDoc(attendanceRef(sem.id), { records: sem.attendanceData || [] })
    )
  );
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