/* global process */
import http from "http";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const attendanceFile = path.join(dataDir, "attendance.json");
const timetablesFile = path.join(dataDir, "timetables.json");
const remindersFile = path.join(dataDir, "reminders.json");

const fallbackAttendance = {
  currentSemesterId: "sem2",
  semesters: [],
};

const fallbackTimetables = {
  timetables: {},
};

const fallbackReminders = {
  reminders: {},
};

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

const server = http.createServer(async (req, res) => {
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
          semesters: semesters.map(({ reminders, timetable, ...semester }) => semester),
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

        const { timetables } = parsed ?? {};
        if (!timetables || typeof timetables !== "object") {
          return sendJson(res, 400, { error: "timetables must be an object." });
        }

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

        const { reminders } = parsed ?? {};
        if (!reminders || typeof reminders !== "object") {
          return sendJson(res, 400, { error: "reminders must be an object." });
        }

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