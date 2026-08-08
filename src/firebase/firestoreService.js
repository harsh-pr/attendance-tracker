// src/firebase/firestoreService.js
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
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

function saveGuestAppData(updater) {
  try {
    const raw = localStorage.getItem("GUEST_APP_DATA");
    const current = raw
      ? JSON.parse(raw)
      : {
          currentSemesterId: "",
          semesters: [],
          subjectsBySemester: {},
          timetablesBySemester: {},
          remindersBySemester: {},
        };
    const updated = updater(current);
    localStorage.setItem("GUEST_APP_DATA", JSON.stringify(updated));
  } catch (e) {
    console.error("[GuestStorage] Save failed", e);
  }
}

// ─── LOAD ALL DATA ────────────────────────────────────────────────────────────
export async function loadAllData() {
  if (!auth.currentUser) {
    const raw = localStorage.getItem("GUEST_APP_DATA");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse GUEST_APP_DATA", e);
      }
    }
    return null;
  }

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

  const subjectsBySemester   = subjectsDoc.data   || subjectsDoc.subjectsBySemester || {};
  const timetablesBySemester = timetablesDoc.data  || timetablesDoc.timetables       || {};
  const remindersBySemester  = remindersDoc.data   || remindersDoc.reminders          || {};

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
  if (!auth.currentUser) {
    saveGuestAppData((prev) => ({
      ...prev,
      currentSemesterId,
      semesters: semesters,
    }));
    return;
  }
  const semesterStubs = semesters.map(({ id, name }) => ({ id, name }));
  await setDoc(metaRef(), { currentSemesterId, semesters: semesterStubs });
}

// ─── SAVE ATTENDANCE ─────────────────────────────────────────────────────────
export async function saveAttendance(semesterId, attendanceData) {
  if (!auth.currentUser) {
    saveGuestAppData((prev) => {
      const sems = (prev.semesters || []).map((s) =>
        s.id === semesterId ? { ...s, attendanceData } : s
      );
      return { ...prev, semesters: sems };
    });
    return;
  }
  await setDoc(attendanceRef(semesterId), { records: attendanceData || [] });
}

// ─── SAVE SUBJECTS ────────────────────────────────────────────────────────────
export async function saveSubjects(subjectsBySemester) {
  if (!auth.currentUser) {
    saveGuestAppData((prev) => ({ ...prev, subjectsBySemester }));
    return;
  }
  await setDoc(subjectsRef(), { data: subjectsBySemester });
}

// ─── SAVE TIMETABLES ─────────────────────────────────────────────────────────
export async function saveTimetables(timetablesBySemester) {
  if (!auth.currentUser) {
    saveGuestAppData((prev) => ({ ...prev, timetablesBySemester }));
    return;
  }
  await setDoc(timetablesRef(), { data: timetablesBySemester });
}

// ─── SAVE REMINDERS ──────────────────────────────────────────────────────────
export async function saveReminders(remindersBySemester) {
  if (!auth.currentUser) {
    saveGuestAppData((prev) => ({ ...prev, remindersBySemester }));
    return;
  }
  await setDoc(remindersRef(), { data: remindersBySemester });
}

// ─── COLLEGE TIMETABLE SYNC ──────────────────────────────────────────────────
export async function getCollegeTimetable(semesterId) {
  if (!auth.currentUser) {
    const raw = localStorage.getItem(`GUEST_COLLEGE_TIMETABLE_${semesterId}`);
    return raw ? JSON.parse(raw) : null;
  }
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
  if (!auth.currentUser) {
    localStorage.setItem(`GUEST_COLLEGE_TIMETABLE_${semesterId}`, JSON.stringify(timetableData));
    return;
  }
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

// ─── DELETE ALL USER DATA ───────────────────────────────────────────────────
export async function deleteAllUserData(userId) {
  if (!userId) return;
  try {
    const batch = writeBatch(db);

    const mRef = doc(db, "users", userId, "meta", "app");
    const sRef = doc(db, "users", userId, "subjects", "data");
    const tRef = doc(db, "users", userId, "timetables", "data");
    const rRef = doc(db, "users", userId, "reminders", "data");

    const metaSnap = await getDoc(mRef);
    if (metaSnap.exists()) {
      const semesters = metaSnap.data().semesters || [];
      for (const sem of semesters) {
        batch.delete(doc(db, "users", userId, "semesters", sem.id, "attendance", "data"));
        batch.delete(doc(db, "users", userId, "college_timetable", sem.id));
      }
    }

    batch.delete(mRef);
    batch.delete(sRef);
    batch.delete(tRef);
    batch.delete(rRef);
    batch.delete(doc(db, "users", userId));

    await batch.commit();
    console.log(`[Firestore] Successfully deleted all data for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("[Firestore] Error deleting user data:", error);
    throw error;
  }
}

// ─── TEMPORARY SHARE TIMETABLE FUNCTIONS ─────────────────────────────────────

function generateShareCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createTemporaryShareCode(payload) {
  try {
    const code = generateShareCode();
    const shareRef = doc(db, "temp_shared_timetables", code);

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    const userEmail = auth.currentUser?.email || "Anonymous";

    const shareData = {
      code,
      payload,
      sharedBy: userEmail,
      createdAt: now,
      expiresAt,
    };

    await setDoc(shareRef, shareData);
    return { code, expiresAt };
  } catch (error) {
    console.error("[Firestore] Error creating share code:", error);
    throw error;
  }
}

export async function peekShareCode(code) {
  if (!code) throw new Error("Share code is required.");
  const cleanCode = code.trim().toUpperCase();
  const shareRef = doc(db, "temp_shared_timetables", cleanCode);
  const snap = await getDoc(shareRef);

  if (!snap.exists()) {
    throw new Error("Invalid or expired share code. Please check the code and try again.");
  }

  const data = snap.data();
  if (data.expiresAt && Date.now() > data.expiresAt) {
    await deleteDoc(shareRef).catch(() => {});
    throw new Error("This share code has expired.");
  }

  return data;
}

export async function consumeShareCode(code) {
  if (!code) throw new Error("Share code is required.");
  const cleanCode = code.trim().toUpperCase();
  const shareRef = doc(db, "temp_shared_timetables", cleanCode);
  const snap = await getDoc(shareRef);

  if (!snap.exists()) {
    throw new Error("Invalid or expired share code. Please ask your friend to generate a new code.");
  }

  const data = snap.data();
  if (data.expiresAt && Date.now() > data.expiresAt) {
    await deleteDoc(shareRef).catch(() => {});
    throw new Error("This share code has expired.");
  }

  try {
    await deleteDoc(shareRef);
  } catch (err) {
    console.warn("[Firestore] Failed to delete consumed code:", err);
  }

  return data.payload;
}