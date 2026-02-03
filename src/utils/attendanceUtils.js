import { getTodayDate } from "../store/attendanceStore";

/* ===== HELPERS ===== */
export function isConducted(status) {
  return status !== "cancelled";
}

export function isAttended(status) {
  return status === "present" || status === "free";
}

/* ===== SUBJECT-WISE ATTENDANCE ===== */
export function getSubjectWiseStatus(attendanceData, subjects) {
  const result = {};

  subjects.forEach((subject) => {
    result[subject.id] = {
      subject,
      attended: 0,
      conducted: 0,
      percentage: 0,
      status: "No Data",
    };
  });

  attendanceData.forEach((day) => {
    day.lectures.forEach((lecture) => {
      const bucket = result[lecture.subjectId];
      if (!bucket) return;
      if (!isConducted(lecture.status)) return;

      bucket.conducted++;
      if (isAttended(lecture.status)) {
        bucket.attended++;
      }
    });
  });

  Object.values(result).forEach((item) => {
    if (item.conducted === 0) {
      item.percentage = 0;
      item.status = "No Data";
    } else {
      item.percentage = Math.round(
        (item.attended / item.conducted) * 100
      );
      item.status =
        item.percentage >= 75 ? "Safe" : "Risk";
    }
  });

  return result;
}

/* ===== DASHBOARD OVERALL (THEORY ONLY) ===== */
export function calculateOverallAttendance(semester) {
  const today = getTodayDate();

  let todayAttended = 0;
  let todayTotal = 0;

  let theoryConducted = 0;
  let theoryAttended = 0;

  let labConducted = 0;
  let labAttended = 0;

  semester.attendanceData.forEach((day) => {
    day.lectures.forEach((lecture) => {
      const subject = semester.subjects.find(
        (s) => s.id === lecture.subjectId
      );
      if (!subject) return;

      const isCancelled = lecture.status === "cancelled";
      const isAttended =
        lecture.status === "present" ||
        lecture.status === "free";

      // ----- TODAY -----
      if (!isCancelled && day.date === today) {
        todayTotal++;
        if (isAttended) todayAttended++;
      }

      if (isCancelled) return;

      // ----- THEORY -----
      if (subject.type === "theory") {
        theoryConducted++;
        if (isAttended) theoryAttended++;
      }

      // ----- LAB -----
      if (subject.type === "lab") {
        labConducted++;
        if (isAttended) labAttended++;
      }
    });
  });

  const theoryPercentage =
    theoryConducted === 0
      ? 0
      : Math.round(
          (theoryAttended / theoryConducted) * 100
        );

  const labPercentage =
    labConducted === 0
      ? 0
      : Math.round(
          (labAttended / labConducted) * 100
        );

  const overallConducted =
    theoryConducted + labConducted;
  const overallAttended =
    theoryAttended + labAttended;

  const overallPercentage =
    overallConducted === 0
      ? 0
      : Math.round(
          (overallAttended / overallConducted) * 100
        );

  return {
    todayAttended,
    todayTotal,

    theory: {
      conducted: theoryConducted,
      attended: theoryAttended,
      percentage: theoryPercentage,
    },

    lab: {
      conducted: labConducted,
      attended: labAttended,
      percentage: labPercentage,
    },

    overall: {
      conducted: overallConducted,
      attended: overallAttended,
      percentage: overallPercentage,
    },
  };
}

export function buildCumulativeAttendanceSeries(attendanceData, days) {
  let totalConducted = 0;
  let totalAttended = 0;

  return days.map(date => {
    const day = attendanceData.find(d => d.date === date);

    if (day) {
      day.lectures.forEach(l => {
        if (l.status === "cancelled") return;

        totalConducted++;

        if (l.status === "present" || l.status === "free") {
          totalAttended++;
        }
      });
    }

    const percentage =
      totalConducted === 0
        ? 0
        : Math.round((totalAttended / totalConducted) * 100);

    return {
      date,
      percentage,
      totalConducted,
      totalAttended,
    };
  });
}
