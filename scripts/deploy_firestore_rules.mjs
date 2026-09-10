import { initializeApp, cert } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";
import * as fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
const rulesSource = fs.readFileSync("./firestore.rules", "utf8");

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

async function deployRules() {
  try {
    console.log("Deploying firestore.rules to project:", serviceAccount.project_id);
    const rules = getSecurityRules(app);
    const ruleset = await rules.releaseFirestoreRulesetFromSource(rulesSource);
    console.log("Successfully released ruleset:", ruleset.name);
    console.log("Rules deployment complete!");
  } catch (err) {
    console.error("Failed to deploy firestore rules:", err);
    process.exit(1);
  }
}

deployRules();
