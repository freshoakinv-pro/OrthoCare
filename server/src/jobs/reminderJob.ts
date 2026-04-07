import cron from "node-cron";
import { and, eq, lte } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { notificationLogs, promSchedules } from "../db/schema.js";
import { sendEmail } from "../services/notifications.js";
import { advanceNextDue } from "../services/promScores.js";
import { randomUUID } from "node:crypto";
export function startReminderJob(): void {
  cron.schedule("0 * * * *", async () => {
    const db = getDb();
    const now = new Date();
    let due: typeof promSchedules.$inferSelect[] = [];
    try {
      due = await db
        .select()
        .from(promSchedules)
        .where(
          and(eq(promSchedules.isActive, true), lte(promSchedules.nextDueAt, now)),
        );
    } catch (e) {
      console.error("[reminderJob] query failed", e);
      return;
    }

    for (const sch of due) {
      try {
        const notifId = randomUUID();
        await db.insert(notificationLogs).values({
          id: notifId,
          clinicId: sch.clinicId,
          patientId: sch.patientId,
          notificationType: "PROM_REMINDER",
          channel: "EMAIL",
          status: "PENDING",
          scheduledAt: now,
        });

        const placeholderTo = `patient-${sch.patientId.slice(0, 8)}@placeholder.local`;
        sendEmail(placeholderTo, "PROM reminder", "Your outcome assessment is due.");

        const next = advanceNextDue(now, sch.frequency);
        await db
          .update(promSchedules)
          .set({
            nextDueAt: next ?? sch.nextDueAt,
            isActive: next != null,
            lastSentAt: now,
          })
          .where(eq(promSchedules.id, sch.id));

        await db
          .update(notificationLogs)
          .set({ status: "SENT", sentAt: new Date() })
          .where(eq(notificationLogs.id, notifId));
      } catch (e) {
        console.error("[reminderJob] schedule failed", sch.id, e);
      }
    }
  });
}
