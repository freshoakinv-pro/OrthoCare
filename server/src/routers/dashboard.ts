import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import {
  appointments,
  clinicalEpisodes,
  patients,
  promSchedules,
  promSubmissions,
  promTypes,
} from "../db/schema.js";
import { requireAuthUser } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

function getClinicId(
  ctx: { user: import("../middleware/context.js").AuthUser },
  inputClinic?: string,
): string {
  const u = ctx.user;
  if (u.role === "MSO_ADMIN") {
    if (!inputClinic) throw new TRPCError({ code: "BAD_REQUEST", message: "clinicId required" });
    return inputClinic;
  }
  if (!u.clinicId) throw new TRPCError({ code: "FORBIDDEN", message: "No clinic" });
  if (inputClinic && inputClinic !== u.clinicId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinic mismatch" });
  }
  return u.clinicId;
}

export const dashboardRouter = router({
  doctorSummary: protectedProcedure
    .input(z.object({ clinicId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "CLINIC_DOCTOR");
      const clinicId = getClinicId(ctx, input.clinicId);
      const u = requireAuthUser(ctx);
      const db = getDb();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const today = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, clinicId),
            eq(appointments.doctorId, u.userId),
            gte(appointments.scheduledAt, start),
            lte(appointments.scheduledAt, end),
          ),
        )
        .orderBy(asc(appointments.scheduledAt));

      const patientRows = await db
        .select({ id: patients.id })
        .from(patients)
        .where(
          and(eq(patients.clinicId, clinicId), eq(patients.assignedDoctorId, u.userId)),
        );

      const patientIds = patientRows.map((p) => p.id);
      const flagged: { patientId: string; reason: string }[] = [];
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);

      for (const pid of patientIds.slice(0, 200)) {
        const subs = await db
          .select()
          .from(promSubmissions)
          .where(and(eq(promSubmissions.patientId, pid), eq(promSubmissions.clinicId, clinicId)))
          .orderBy(desc(promSubmissions.submittedAt))
          .limit(5);
        if (subs.length >= 2) {
          const drop = subs[0]!.totalScore - subs[1]!.totalScore;
          const type0 = await db
            .select()
            .from(promTypes)
            .where(eq(promTypes.id, subs[0]!.promTypeId))
            .limit(1);
          const higherBetter = type0[0]?.scoreDirection === "HIGHER_BETTER";
          if (higherBetter && drop < -10) {
            flagged.push({ patientId: pid, reason: "PROM deterioration (>10 drop)" });
          }
          if (!higherBetter && drop > 10) {
            flagged.push({ patientId: pid, reason: "PROM deterioration (worsening)" });
          }
        }
        const overdue = await db
          .select()
          .from(promSchedules)
          .where(
            and(
              eq(promSchedules.patientId, pid),
              eq(promSchedules.clinicId, clinicId),
              eq(promSchedules.isActive, true),
              lte(promSchedules.nextDueAt, twoWeeksAgo),
            ),
          )
          .limit(1);
        if (overdue.length && !flagged.find((f) => f.patientId === pid)) {
          flagged.push({ patientId: pid, reason: "PROM overdue >14 days" });
        }
      }

      const activeEpisodes = await db
        .select({ c: count() })
        .from(clinicalEpisodes)
        .where(
          and(
            eq(clinicalEpisodes.clinicId, clinicId),
            eq(clinicalEpisodes.doctorId, u.userId),
            eq(clinicalEpisodes.episodeStatus, "ACTIVE"),
          ),
        );

      const pendingSchedules = await db
        .select()
        .from(promSchedules)
        .where(
          and(
            eq(promSchedules.clinicId, clinicId),
            lte(promSchedules.nextDueAt, new Date()),
            eq(promSchedules.isActive, true),
          ),
        )
        .limit(50);

      const recentSubs = await db
        .select()
        .from(promSubmissions)
        .where(eq(promSubmissions.clinicId, clinicId))
        .orderBy(desc(promSubmissions.submittedAt))
        .limit(10);

      return {
        todayAppointments: today,
        flaggedPatients: flagged,
        activeEpisodeCount: Number(activeEpisodes[0]?.c ?? 0),
        pendingPromSchedules: pendingSchedules.filter((s) =>
          patientIds.includes(s.patientId),
        ),
        recentPromSubmissions: recentSubs.filter((s) => patientIds.includes(s.patientId)),
      };
    }),

  clinicSummary: protectedProcedure
    .input(z.object({ clinicId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "CLINIC_ADMIN", "MSO_ADMIN");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const newPatients = await db
        .select({
          m: sql<string>`DATE_FORMAT(${patients.createdAt}, '%Y-%m')`.as("m"),
          c: count(),
        })
        .from(patients)
        .where(and(eq(patients.clinicId, clinicId), gte(patients.createdAt, sixMonthsAgo)))
        .groupBy(sql`DATE_FORMAT(${patients.createdAt}, '%Y-%m')`);

      const promByType = await db
        .select({
          promTypeId: promSubmissions.promTypeId,
          c: count(),
        })
        .from(promSubmissions)
        .where(eq(promSubmissions.clinicId, clinicId))
        .groupBy(promSubmissions.promTypeId);

      const outcomeDist = await db
        .select({
          episodeStatus: clinicalEpisodes.episodeStatus,
          c: count(),
        })
        .from(clinicalEpisodes)
        .where(eq(clinicalEpisodes.clinicId, clinicId))
        .groupBy(clinicalEpisodes.episodeStatus);

      const referralDist = await db
        .select({
          referralSource: patients.referralSource,
          c: count(),
        })
        .from(patients)
        .where(eq(patients.clinicId, clinicId))
        .groupBy(patients.referralSource);

      const doctorActivity = await db
        .select({
          doctorId: clinicalEpisodes.doctorId,
          episodes: count(),
        })
        .from(clinicalEpisodes)
        .where(eq(clinicalEpisodes.clinicId, clinicId))
        .groupBy(clinicalEpisodes.doctorId);

      return {
        patientVolumeByMonth: newPatients,
        promCompletionByInstrument: promByType,
        episodeOutcomeDistribution: outcomeDist,
        referralSourceBreakdown: referralDist,
        doctorEpisodeCounts: doctorActivity,
      };
    }),

  patientSummary: protectedProcedure
    .input(z.object({ clinicId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "PATIENT");
      const clinicId = getClinicId(ctx, input.clinicId);
      const u = requireAuthUser(ctx);
      const db = getDb();
      const [pat] = await db
        .select()
        .from(patients)
        .where(and(eq(patients.userId, u.userId), eq(patients.clinicId, clinicId)))
        .limit(1);
      if (!pat) throw new TRPCError({ code: "NOT_FOUND", message: "Patient profile not found" });

      const episodes = await db
        .select()
        .from(clinicalEpisodes)
        .where(and(eq(clinicalEpisodes.patientId, pat.id), eq(clinicalEpisodes.clinicId, clinicId)));

      const scores = await db
        .select()
        .from(promSubmissions)
        .where(and(eq(promSubmissions.patientId, pat.id), eq(promSubmissions.clinicId, clinicId)))
        .orderBy(desc(promSubmissions.submittedAt))
        .limit(20);

      const upcomingAppts = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.patientId, pat.id),
            eq(appointments.clinicId, clinicId),
            gte(appointments.scheduledAt, new Date()),
          ),
        )
        .orderBy(asc(appointments.scheduledAt))
        .limit(5);

      const dueProms = await db
        .select()
        .from(promSchedules)
        .where(
          and(
            eq(promSchedules.patientId, pat.id),
            eq(promSchedules.clinicId, clinicId),
            eq(promSchedules.isActive, true),
          ),
        );

      return {
        patient: pat,
        episodes,
        recentScores: scores,
        upcomingAppointments: upcomingAppts,
        promSchedules: dueProms,
      };
    }),
});
