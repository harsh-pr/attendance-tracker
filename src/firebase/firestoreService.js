// src/firebase/firestoreService.js
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "./config";

function getUserId() {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }
  return auth.currentUser.uid;
}

function metaRef() {
  return doc(db, "users", getUserId(), "meta", "app");
}
function subjectsRef() {
  return doc(db, "users", getUserId(), "subjects", "data");
}
function timetablesRef() {
  return doc(db, "users", getUserId(), "timetables", "data");
}
function remindersRef() {
  return doc(db, "users", getUserId(), "reminders", "data");
}
function attendanceRef(semesterId) {
  return doc(db, "users", getUserId(), "semesters", semesterId, "attendance", "data");
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

// ─── COLLEGE TIMETABLE SYNC ──────────────────────────────────────────────────
export async function getCollegeTimetable(semesterId) {
  try {
    const ref = doc(db, "users", getUserId(), "college_timetable", semesterId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("[Firestore] Error reading college timetable:", error);
    return null;
  }
}

export async function saveCollegeTimetable(semesterId, timetableData) {
  try {
    const ref = doc(db, "users", getUserId(), "college_timetable", semesterId);
    await setDoc(ref, timetableData);
  } catch (error) {
    console.error("[Firestore] Error saving college timetable:", error);
  }
}

// ─── LEGACY DATA OPERATIONS ──────────────────────────────────────────────────
export async function checkLegacyDataExists() {
  try {
    const legacyMetaRef = doc(db, "users", "default_user", "meta", "app");
    const snap = await getDoc(legacyMetaRef);
    return snap.exists();
  } catch (error) {
    console.error("Error checking legacy data:", error);
    return false;
  }
}

export async function importLegacyData(targetUserId) {
  try {
    const defaultUserId = "default_user";
    
    // References for default_user
    const dMetaRef = doc(db, "users", defaultUserId, "meta", "app");
    const dSubjectsRef = doc(db, "users", defaultUserId, "subjects", "data");
    const dTimetablesRef = doc(db, "users", defaultUserId, "timetables", "data");
    const dRemindersRef = doc(db, "users", defaultUserId, "reminders", "data");
    
    // Snaps for default_user
    const [dMetaSnap, dSubjectsSnap, dTimetablesSnap, dRemindersSnap] = await Promise.all([
      getDoc(dMetaRef),
      getDoc(dSubjectsRef),
      getDoc(dTimetablesRef),
      getDoc(dRemindersRef)
    ]);
    
    if (!dMetaSnap.exists()) {
      throw new Error("No legacy data found to import.");
    }
    
    const metaData = dMetaSnap.data();
    const subjectsData = dSubjectsSnap.exists() ? dSubjectsSnap.data() : null;
    const timetablesData = dTimetablesSnap.exists() ? dTimetablesSnap.data() : null;
    const remindersData = dRemindersSnap.exists() ? dRemindersSnap.data() : null;
    
    const batch = writeBatch(db);
    
    // Copy meta, subjects, timetables, reminders
    batch.set(doc(db, "users", targetUserId, "meta", "app"), metaData);
    if (subjectsData) {
      batch.set(doc(db, "users", targetUserId, "subjects", "data"), subjectsData);
    }
    if (timetablesData) {
      batch.set(doc(db, "users", targetUserId, "timetables", "data"), timetablesData);
    }
    if (remindersData) {
      batch.set(doc(db, "users", targetUserId, "reminders", "data"), remindersData);
    }
    
    // Copy semester attendance
    const semesters = metaData.semesters || [];
    for (const sem of semesters) {
      const dAttRef = doc(db, "users", defaultUserId, "semesters", sem.id, "attendance", "data");
      const dAttSnap = await getDoc(dAttRef);
      if (dAttSnap.exists()) {
        batch.set(doc(db, "users", targetUserId, "semesters", sem.id, "attendance", "data"), dAttSnap.data());
      }
    }
    
    await batch.commit();
    console.log(`[Firestore] Successfully migrated default_user data to ${targetUserId}`);
    return true;
  } catch (error) {
    console.error("[Firestore] Migration error:", error);
    throw error;
  }
}

export async function deleteLegacyData() {
  try {
    const defaultUserId = "default_user";
    
    // References for default_user
    const dMetaRef = doc(db, "users", defaultUserId, "meta", "app");
    const dSubjectsRef = doc(db, "users", defaultUserId, "subjects", "data");
    const dTimetablesRef = doc(db, "users", defaultUserId, "timetables", "data");
    const dRemindersRef = doc(db, "users", defaultUserId, "reminders", "data");
    
    const dMetaSnap = await getDoc(dMetaRef);
    const batch = writeBatch(db);
    
    // Delete meta, subjects, timetables, reminders
    batch.delete(dMetaRef);
    batch.delete(dSubjectsRef);
    batch.delete(dTimetablesRef);
    batch.delete(dRemindersRef);
    
    // Delete attendance records for all semesters listed in the meta
    if (dMetaSnap.exists()) {
      const semesters = dMetaSnap.data().semesters || [];
      for (const sem of semesters) {
        batch.delete(doc(db, "users", defaultUserId, "semesters", sem.id, "attendance", "data"));
      }
    }
    
    await batch.commit();
    console.log(`[Firestore] Successfully deleted legacy default_user data.`);
    return true;
  } catch (error) {
    console.error("[Firestore] Error deleting legacy data:", error);
    throw error;
  }
}