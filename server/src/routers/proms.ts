import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { router, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import {
  clinicalEpisodes,
  patients,
  promQuestions,
  promSchedules,
  promSubmissions,
  promTypes,
} from "../db/schema.js";
import { assertClinicAccess, requireAuthUser } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { advanceNextDue, computePromScore } from "../services/promScores.js";

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

export const promsRouter = router({
  listTypes: protectedProcedure.query(async () => {
    const db = getDb();
    return db.select().from(promTypes).orderBy(asc(promTypes.code));
  }),

  getSchedules: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const conds = [
        eq(promSchedules.clinicId, clinicId),
        eq(promSchedules.isActive, true),
      ];
      if (input.patientId) conds.push(eq(promSchedules.patientId, input.patientId));
      return db.select().from(promSchedules).where(and(...conds));
    }),

  getQuestions: protectedProcedure
    .input(z.object({ promTypeId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [pt] = await db.select().from(promTypes).where(eq(promTypes.id, input.promTypeId)).limit(1);
      if (!pt) throw new TRPCError({ code: "NOT_FOUND", message: "PROM type not found" });
      return db
        .select()
        .from(promQuestions)
        .where(eq(promQuestions.promTypeId, input.promTypeId))
        .orderBy(asc(promQuestions.questionOrder));
    }),

  submit: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid(),
        promTypeId: z.number().int().positive(),
        episodeId: z.string().uuid(),
        responses: z.array(
          z.object({
            questionId: z.number().int(),
            responseValue: z.string(),
          }),
        ),
        completedBy: z.enum(["PATIENT", "CLINICIAN"]),
        completionMethod: z.enum(["WEB", "MOBILE", "IN_CLINIC"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR", "PATIENT");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const u = requireAuthUser(ctx);

      const [pat] = await db.select().from(patients).where(eq(patients.id, input.patientId)).limit(1);
      if (!pat || pat.clinicId !== clinicId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid patient" });
      }
      if (u.role === "PATIENT") {
        if (pat.userId !== u.userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
        }
      } else {
        assertClinicAccess(ctx, clinicId);
      }

      const [ep] = await db
        .select()
        .from(clinicalEpisodes)
        .where(eq(clinicalEpisodes.id, input.episodeId))
        .limit(1);
      if (!ep || ep.clinicId !== clinicId || ep.patientId !== input.patientId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid episode" });
      }

      const [pt] = await db.select().from(promTypes).where(eq(promTypes.id, input.promTypeId)).limit(1);
      if (!pt) throw new TRPCError({ code: "NOT_FOUND", message: "PROM type not found" });

      const questions = await db
        .select()
        .from(promQuestions)
        .where(eq(promQuestions.promTypeId, input.promTypeId))
        .orderBy(asc(promQuestions.questionOrder));

      const scores: number[] = [];
      const stored: { questionId: number; responseValue: string; score: number }[] = [];

      for (const q of questions) {
        const ans = input.responses.find((r) => r.questionId === q.id);
        if (!ans) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Missing answer for question ${q.id}` });
        }
        const opt = q.responseOptions.find((o) => o.value === ans.responseValue);
        if (!opt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid response value" });
        }
        let score = opt.score;
        if (q.reverseScored) {
          const maxS = Math.max(...q.responseOptions.map((o) => o.score));
          score = maxS - score;
        }
        scores.push(score);
        stored.push({ questionId: q.id, responseValue: ans.responseValue, score });
      }

      const { totalScore, interpretation } = await computePromScore(pt.code, scores);
      const submittedAt = new Date();
      const submissionDate = submittedAt.toISOString().slice(0, 10);
      const id = randomUUID();

      try {
        await db.insert(promSubmissions).values({
          id,
          clinicId,
          patientId: input.patientId,
          promTypeId: input.promTypeId,
          episodeId: input.episodeId,
          submittedAt,
          submissionDate,
          totalScore,
          scoreInterpretation: interpretation,
          responses: stored,
          completedBy: input.completedBy,
          completionMethod: input.completionMethod,
        });
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Duplicate submission for this date",
        });
      }

      const schedules = await db
        .select()
        .from(promSchedules)
        .where(
          and(
            eq(promSchedules.clinicId, clinicId),
            eq(promSchedules.patientId, input.patientId),
            eq(promSchedules.episodeId, input.episodeId),
            eq(promSchedules.promTypeId, input.promTypeId),
            eq(promSchedules.isActive, true),
          ),
        );

      for (const sch of schedules) {
        const next = advanceNextDue(submittedAt, sch.frequency);
        await db
          .update(promSchedules)
          .set({
            nextDueAt: next ?? sch.nextDueAt,
            isActive: next != null,
          })
          .where(eq(promSchedules.id, sch.id));
      }

      return { id, totalScore, interpretation };
    }),

  getResults: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid(),
        promTypeId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR", "PATIENT");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const u = requireAuthUser(ctx);
      const [pat] = await db.select().from(patients).where(eq(patients.id, input.patientId)).limit(1);
      if (!pat || pat.clinicId !== clinicId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      }
      if (u.role === "PATIENT" && pat.userId !== u.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
      } else if (u.role !== "PATIENT") {
        assertClinicAccess(ctx, clinicId);
      }

      return db
        .select()
        .from(promSubmissions)
        .where(
          and(
            eq(promSubmissions.clinicId, clinicId),
            eq(promSubmissions.patientId, input.patientId),
            eq(promSubmissions.promTypeId, input.promTypeId),
          ),
        )
        .orderBy(desc(promSubmissions.submittedAt))
        .limit(12);
    }),

  createSchedule: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid(),
        episodeId: z.string().uuid(),
        promTypeId: z.number().int().positive(),
        frequency: z.enum([
          "ONE_TIME",
          "WEEKLY",
          "FORTNIGHTLY",
          "MONTHLY",
          "QUARTERLY",
        ]),
        startAt: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const [pat] = await db.select().from(patients).where(eq(patients.id, input.patientId)).limit(1);
      if (!pat || pat.clinicId !== clinicId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid patient" });
      }
      const [ep] = await db
        .select()
        .from(clinicalEpisodes)
        .where(eq(clinicalEpisodes.id, input.episodeId))
        .limit(1);
      if (!ep || ep.clinicId !== clinicId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid episode" });
      }
      const id = randomUUID();
      await db.insert(promSchedules).values({
        id,
        clinicId,
        patientId: input.patientId,
        episodeId: input.episodeId,
        promTypeId: input.promTypeId,
        frequency: input.frequency,
        nextDueAt: input.startAt,
        isActive: true,
      });
      return { id };
    }),

  getPatientDue: protectedProcedure
    .input(z.object({ clinicId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "PATIENT");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const u = requireAuthUser(ctx);
      const [pat] = await db
        .select()
        .from(patients)
        .where(and(eq(patients.userId, u.userId), eq(patients.clinicId, clinicId)))
        .limit(1);
      if (!pat) return [];
      const now = new Date();
      return db
        .select()
        .from(promSchedules)
        .where(
          and(
            eq(promSchedules.clinicId, clinicId),
            eq(promSchedules.patientId, pat.id),
            eq(promSchedules.isActive, true),
            lte(promSchedules.nextDueAt, now),
          ),
        );
    }),
});
