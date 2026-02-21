import { promises as fs } from "fs";
import path from "path";

function normalizeDate(dateValue) {
  if (typeof dateValue !== "string") return dateValue;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
}

function cleanLecture(lecture = {}) {
  return {
    subjectId: lecture.subjectId,
    type: lecture.type || "theory",
    status: lecture.status ?? null,
  };
}

function cleanAttendanceDay(day = {}) {
  const payload = {
    date: normalizeDate(day.date),
    lectures: Array.isArray(day.lectures) ? day.lectures.map(cleanLecture) : [],
  };

  if (day.dayType === "exam" || day.dayType === "holiday") {
    payload.dayType = day.dayType;
  }

  return payload;
}

function splitPayload(raw = {}) {
  const semesters = Array.isArray(raw.semesters) ? raw.semesters : [];

  const attendance = {
    currentSemesterId: raw.currentSemesterId ?? semesters[0]?.id ?? null,
    semesters: semesters.map((semester) => ({
      id: semester.id,
      name: semester.name,
      attendanceData: Array.isArray(semester.attendanceData)
        ? semester.attendanceData.map(cleanAttendanceDay)
        : [],
    })),
  };

  const subjectsBySemester = {};
  semesters.forEach((semester) => {
    subjectsBySemester[semester.id] = Array.isArray(semester.subjects)
      ? semester.subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          type: subject.type === "lab" ? "lab" : "theory",
        }))
      : [];
  });

  const subjects = { subjectsBySemester };
  return { attendance, subjects };
}

async function main() {
  const inputPath = process.argv[2] || path.join("data", "attendance.json");
  const outputDir = process.argv[3] || path.dirname(inputPath);

  const rawText = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(rawText);

  const { attendance, subjects } = splitPayload(parsed);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "attendance.json"), `${JSON.stringify(attendance, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "subjects.json"), `${JSON.stringify(subjects, null, 2)}\n`);

  console.log(`Wrote cleaned attendance to ${path.join(outputDir, "attendance.json")}`);
  console.log(`Wrote separated subjects to ${path.join(outputDir, "subjects.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});