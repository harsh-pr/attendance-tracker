import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const ref = doc(db, "attendanceData", "userData");

/* LOAD EVERYTHING */
export async function loadCloudData() {
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

/* SAVE PART */
export async function saveAttendance(semesters, currentSemesterId) {
  await setDoc(ref, { attendance: { semesters, currentSemesterId } }, { merge: true });
}

export async function saveSubjects(subjectsBySemester) {
  await setDoc(ref, { subjects: subjectsBySemester }, { merge: true });
}

export async function saveTimetables(timetablesBySemester) {
  await setDoc(ref, { timetables: timetablesBySemester }, { merge: true });
}

export async function saveReminders(remindersBySemester) {
  await setDoc(ref, { reminders: remindersBySemester }, { merge: true });
}