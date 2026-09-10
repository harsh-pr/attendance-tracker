/* global process */
import http from "http";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const attendanceFile = path.join(dataDir, "attendance.json");
const subjectsFile = path.join(dataDir, "subjects.json");
const timetablesFile = path.join(dataDir, "timetables.json");
const remindersFile = path.join(dataDir, "reminders.json");

const fallbackAttendance = {
  currentSemesterId: "sem2",
  semesters: [],
};

const fallbackSubjects = {
  subjectsBySemester: {},
};

const fallbackTimetables = {
  timetables: {},
};

const fallbackReminders = {
  reminders: {},
};

let migrationCompleted = false;

async function readJsonFile(filePath, fallback, label) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    try {
      return JSON.parse(raw);
    } catch (parseError) {
      console.error(`${label} JSON is invalid.`, parseError);
      await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to read ${label.toLowerCase()}.`, error);
      return fallback;
    }

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeJsonFile(filePath, payload) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function migrateLegacySubjects() {
  if (migrationCompleted) return;

  const attendanceData = await readJsonFile(attendanceFile, fallbackAttendance, "Attendance data");
  const subjectsData = await readJsonFile(subjectsFile, fallbackSubjects, "Subject data");

  let attendanceChanged = false;
  let subjectsChanged = false;

  const migratedSemesters = (attendanceData.semesters || []).map((semester) => {
    if (!Array.isArray(semester.subjects)) {
      return semester;
    }

    if (!Array.isArray(subjectsData.subjectsBySemester?.[semester.id])) {
      subjectsData.subjectsBySemester = {
        ...(subjectsData.subjectsBySemester || {}),
        [semester.id]: semester.subjects,
      };
      subjectsChanged = true;
    }

    attendanceChanged = true;
    const { subjects: _, ...rest } = semester;
    return rest;
  });

  if (attendanceChanged) {
    await writeJsonFile(attendanceFile, {
      currentSemesterId: attendanceData.currentSemesterId,
      semesters: migratedSemesters,
    });
  }

  if (subjectsChanged) {
    await writeJsonFile(subjectsFile, {
      subjectsBySemester: subjectsData.subjectsBySemester || {},
    });
  }

  migrationCompleted = true;
}

const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024; // 2 MB maximum body size

function readRequestBody(req, res) {
  return new Promise((resolve, reject) => {
    let body = "";
    let received = 0;

    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > MAX_PAYLOAD_SIZE) {
        sendJson(res, 413, { error: "Payload Too Large. Maximum allowed size is 2MB." });
        req.destroy();
        reject(new Error("Payload too large"));
        return;
      }
      body += chunk;
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

function setSecurityHeaders(res, origin) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  setSecurityHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  await migrateLegacySubjects();

  if (req.url === "/api/semesters" && req.method === "GET") {
    try {
      const data = await readJsonFile(attendanceFile, fallbackAttendance, "Attendance data");
      return sendJson(res, 200, data);
    } catch (error) {
      console.error("Failed to read attendance data.", error);
      return sendJson(res, 500, { error: "Failed to read attendance data." });
    }
  }

  if (req.url === "/api/semesters" && req.method === "PUT") {
    try {
      const body = await readRequestBody(req, res);
      let parsed = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch (parseError) {
        console.error("Failed to parse attendance payload.", parseError);
        return sendJson(res, 400, { error: "Invalid JSON payload." });
      }
      const { currentSemesterId, semesters } = parsed ?? {};

      if (!Array.isArray(semesters)) {
        return sendJson(res, 400, { error: "semesters must be an array." });
      }

      const payload = {
        currentSemesterId: currentSemesterId ?? semesters[0]?.id ?? null,
        semesters: semesters.map(({ id, name, attendanceData }) => ({
          id,
          name,
          attendanceData: Array.isArray(attendanceData) ? attendanceData : [],
        })),
      };

      await writeJsonFile(attendanceFile, payload);
      return sendJson(res, 200, payload);
    } catch (error) {
      if (error.message === "Payload too large") return;
      console.error("Failed to save attendance data.", error);
      return sendJson(res, 500, { error: "Failed to save attendance data." });
    }
  }

  if (req.url === "/api/subjects" && req.method === "GET") {
    try {
      const data = await readJsonFile(subjectsFile, fallbackSubjects, "Subject data");
      return sendJson(res, 200, data);
    } catch (error) {
      console.error("Failed to read subject data.", error);
      return sendJson(res, 500, { error: "Failed to read subject data." });
    }
  }

  if (req.url === "/api/subjects" && req.method === "PUT") {
    try {
      const body = await readRequestBody(req, res);
      let parsed = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch (parseError) {
        console.error("Failed to parse subjects payload.", parseError);
        return sendJson(res, 400, { error: "Invalid JSON payload." });
      }

      const { subjectsBySemester } = parsed ?? {};
      if (!subjectsBySemester || typeof subjectsBySemester !== "object") {
        return sendJson(res, 400, { error: "subjectsBySemester must be an object." });
      }

      const payload = { subjectsBySemester };
      await writeJsonFile(subjectsFile, payload);
      return sendJson(res, 200, payload);
    } catch (error) {
      if (error.message === "Payload too large") return;
      console.error("Failed to save subject data.", error);
      return sendJson(res, 500, { error: "Failed to save subject data." });
    }
  }

  if (req.url === "/api/timetables" && req.method === "GET") {
    try {
      const data = await readJsonFile(timetablesFile, fallbackTimetables, "Timetable data");
      return sendJson(res, 200, data);
    } catch (error) {
      console.error("Failed to read timetable data.", error);
      return sendJson(res, 500, { error: "Failed to read timetable data." });
    }
  }

  if (req.url === "/api/timetables" && req.method === "PUT") {
    try {
      const body = await readRequestBody(req, res);
      let parsed = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch (parseError) {
        console.error("Failed to parse timetable payload.", parseError);
        return sendJson(res, 400, { error: "Invalid JSON payload." });
      }

      const parsedTimetables = parsed?.timetables;
      const timetables =
        parsedTimetables && typeof parsedTimetables === "object" ? parsedTimetables : {};

      const payload = { timetables };
      await writeJsonFile(timetablesFile, payload);
      return sendJson(res, 200, payload);
    } catch (error) {
      if (error.message === "Payload too large") return;
      console.error("Failed to save timetable data.", error);
      return sendJson(res, 500, { error: "Failed to save timetable data." });
    }
  }

  if (req.url === "/api/reminders" && req.method === "GET") {
    try {
      const data = await readJsonFile(remindersFile, fallbackReminders, "Reminder data");
      return sendJson(res, 200, data);
    } catch (error) {
      console.error("Failed to read reminder data.", error);
      return sendJson(res, 500, { error: "Failed to read reminder data." });
    }
  }

  if (req.url === "/api/reminders" && req.method === "PUT") {
    try {
      const body = await readRequestBody(req, res);
      let parsed = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch (parseError) {
        console.error("Failed to parse reminder payload.", parseError);
        return sendJson(res, 400, { error: "Invalid JSON payload." });
      }

      const parsedReminders = parsed?.reminders;
      const reminders =
        parsedReminders && typeof parsedReminders === "object" ? parsedReminders : {};

      const payload = { reminders };
      await writeJsonFile(remindersFile, payload);
      return sendJson(res, 200, payload);
    } catch (error) {
      if (error.message === "Payload too large") return;
      console.error("Failed to save reminder data.", error);
      return sendJson(res, 500, { error: "Failed to save reminder data." });
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const port = Number(process.env.ATTENDANCE_PORT) || 5174;
const host = process.env.ATTENDANCE_HOST || "127.0.0.1";
server.listen(port, host, () => {
  console.log(`Attendance data server running securely on ${host}:${port}`);
});