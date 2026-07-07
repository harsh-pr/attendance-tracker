/* global process */
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "..", "serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
} catch (error) {
  console.error("❌ Failed to read serviceAccountKey.json. Ensure it exists in the root folder.");
  console.error(error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db   = admin.firestore();

// EXEMPT list: documents in the "users" collection that should not be deleted
const EXEMPT_USERS = new Set(["default_user"]);

async function getAllActiveUids() {
  const uids = new Set();
  let pageToken = undefined;
  
  do {
    const result = await auth.listUsers(1000, pageToken);
    result.users.forEach((user) => {
      uids.add(user.uid);
    });
    pageToken = result.pageToken;
  } while (pageToken);
  
  return uids;
}

async function cleanOrphanedUsers() {
  console.log("🧹 Starting Firestore orphaned users cleanup...");
  
  // 1. Get active user UIDs from Auth
  console.log("👉 Fetching active users from Firebase Authentication...");
  const activeUids = await getAllActiveUids();
  console.log(`ℹ️ Found ${activeUids.size} active users in Auth.\n`);

  // 2. Get user document IDs from Firestore "users" collection
  console.log("👉 Fetching users from Firestore...");
  const usersSnapshot = await db.collection("users").get();
  
  const orphanedUids = [];
  usersSnapshot.forEach((doc) => {
    const id = doc.id;
    if (!activeUids.has(id) && !EXEMPT_USERS.has(id)) {
      orphanedUids.push(id);
    }
  });

  if (orphanedUids.length === 0) {
    console.log("🎉 No orphaned users found in Firestore. Everything is clean!");
    return;
  }

  console.log(`⚠️ Found ${orphanedUids.length} orphaned user documents in Firestore:`);
  orphanedUids.forEach(uid => console.log(`   - users/${uid}`));
  console.log("");

  // 3. Delete orphaned documents and subcollections recursively
  for (const uid of orphanedUids) {
    console.log(`🔴 Deleting users/${uid} and all its subcollections...`);
    const docRef = db.collection("users").doc(uid);
    
    try {
      await db.recursiveDelete(docRef);
      console.log(`✅ Successfully deleted users/${uid}`);
    } catch (err) {
      console.error(`❌ Failed to delete users/${uid}:`, err.message);
    }
  }

  console.log("\n✨ Cleanup finished!");
}

cleanOrphanedUsers().catch((err) => {
  console.error("❌ Cleanup script failed:", err);
  process.exit(1);
});
