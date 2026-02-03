/* global process */
import http from "http";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "attendance.json");
const fallbackData = {
  currentSemesterId: "sem2",
  semesters: [],
};

async function readData() {
  try {
    const raw = await fs.readFile(dataFile, "utf-8");
    try {
      return JSON.parse(raw);
    } catch (parseError) {
      console.error("Attendance data JSON is invalid.", parseError);
      await fs.writeFile(dataFile, JSON.stringify(fallbackData, null, 2));
      return fallbackData;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to read attendance data.", error);
      return fallbackData;
    }

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(fallbackData, null, 2));
    return fallbackData;
  }
}

async function writeData(payload) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(payload, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/semesters" && req.method === "GET") {
    try {
      const data = await readData();
      return sendJson(res, 200, data);
    } catch (error) {
      console.error("Failed to read attendance data.", error);
      return sendJson(res, 500, {
        error: "Failed to read attendance data.",
      });
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
          return sendJson(res, 400, {
            error: "Invalid JSON payload.",
          });
        }
        const { currentSemesterId, semesters } = parsed ?? {};

        if (!Array.isArray(semesters)) {
          return sendJson(res, 400, {
            error: "semesters must be an array.",
          });
        }

        const payload = {
          currentSemesterId:
            currentSemesterId ?? semesters[0]?.id ?? null,
          semesters,
        };

        await writeData(payload);
        return sendJson(res, 200, payload);
      } catch (error) {
        console.error("Failed to save attendance data.", error);
        return sendJson(res, 500, {
          error: "Failed to save attendance data.",
        });
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