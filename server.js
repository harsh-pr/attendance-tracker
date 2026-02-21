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
    const { subjects, ...rest } = semester;
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

const server = http.createServer(async (req, res) => {
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
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
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
        console.error("Failed to save attendance data.", error);
        return sendJson(res, 500, { error: "Failed to save attendance data." });
      }
    });

    return;
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
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
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
        console.error("Failed to save subject data.", error);
        return sendJson(res, 500, { error: "Failed to save subject data." });
      }
    });

    return;
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
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
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
        console.error("Failed to save timetable data.", error);
        return sendJson(res, 500, { error: "Failed to save timetable data." });
      }
    });

    return;
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
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
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
        console.error("Failed to save reminder data.", error);
        return sendJson(res, 500, { error: "Failed to save reminder data." });
      }
    });

    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const port = Number(process.env.ATTENDANCE_PORT) || 5174;
server.listen(port, () => {
  console.log(`Attendance data server running on ${port}`);
});