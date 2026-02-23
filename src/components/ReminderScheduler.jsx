// src/components/ReminderScheduler.jsx
// Drop this component inside App.jsx — it runs on every page
import { useEffect } from "react";
import { useSemester } from "../context/SemesterContext";

function buildReminderTriggerTime(dateString, timeString) {
  if (!dateString) return null;
  const timeValue = timeString || "00:00";
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes]   = timeValue.split(":").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, isNaN(hours) ? 0 : hours, isNaN(minutes) ? 0 : minutes);
}

export default function ReminderScheduler() {
  const { semesters, remindersBySemester, removeReminder, currentSemesterId } = useSemester();

  // Collect ALL reminders across ALL semesters
  const allReminders = semesters.flatMap((sem) =>
    (remindersBySemester?.[sem.id] || []).map((r) => ({ ...r, semesterId: sem.id }))
  );

  useEffect(() => {
    if (!allReminders.length) return;

    const timeouts = allReminders
      .filter((r) => !r.delivered)
      .map((reminder) => {
        const triggerTime = reminder.triggerAt
          ? new Date(reminder.triggerAt)
          : buildReminderTriggerTime(reminder.date, reminder.time);

        if (!triggerTime || isNaN(triggerTime.getTime())) return null;

        const delay = triggerTime.getTime() - Date.now();
        if (delay < 0) return null; // already past

        return window.setTimeout(async () => {
          const body = `${reminder.date}${reminder.time ? ` at ${reminder.time}` : ""}`;

          if ("Notification" in window && Notification.permission === "granted") {
            if ("serviceWorker" in navigator) {
              try {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                  await reg.showNotification(reminder.title, {
                    body,
                    tag: `reminder-${reminder.id}`,
                    renotify: true,
                  });
                } else {
                  new Notification(reminder.title, { body });
                }
              } catch {
                new Notification(reminder.title, { body });
              }
            } else {
              new Notification(reminder.title, { body });
            }
          } else {
            window.alert(`🔔 Reminder: ${reminder.title}\n${body}`);
          }

          removeReminder(reminder.id);
        }, delay);
      })
      .filter(Boolean);

    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, [JSON.stringify(allReminders)]);

  return null; // renders nothing
}