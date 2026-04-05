import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { router, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import { clinicalEpisodes, patients } from "../db/schema.js";
import { assertClinicAccess, requireAuthUser } from "../middleware/auth.js";
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

export const episodesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid().optional(),
        status: z.enum(["ACTIVE", "RECOVERED", "CHRONIC", "SURGICAL", "DISCHARGED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR", "PATIENT");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const u = requireAuthUser(ctx);
      const conds = [eq(clinicalEpisodes.clinicId, clinicId)];
      if (input.patientId) conds.push(eq(clinicalEpisodes.patientId, input.patientId));
      if (input.status) conds.push(eq(clinicalEpisodes.episodeStatus, input.status));
      if (u.role === "PATIENT") {
        const [pat] = await db
          .select({ id: patients.id })
          .from(patients)
          .where(and(eq(patients.userId, u.userId), eq(patients.clinicId, clinicId)))
          .limit(1);
        if (!pat) throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
        conds.push(eq(clinicalEpisodes.patientId, pat.id));
      }
      return db.select().from(clinicalEpisodes).where(and(...conds));
    }),

  create: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid(),
        doctorId: z.string().uuid(),
        diagnosisCode: z.string().min(1).max(32),
        diagnosisLabel: z.string().min(1).max(512),
        bodyRegion: z.enum([
          "KNEE",
          "HIP",
          "SHOULDER",
          "SPINE",
          "FOOT_ANKLE",
          "HAND_WRIST",
          "OTHER",
        ]),
        laterality: z.enum(["LEFT", "RIGHT", "BILATERAL"]),
        episodeStatus: z.enum(["ACTIVE", "RECOVERED", "CHRONIC", "SURGICAL", "DISCHARGED"]),
        openedAt: z.coerce.date().optional(),
        notes: z.string().optional(),
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
      const id = randomUUID();
      await db.insert(clinicalEpisodes).values({
        id,
        clinicId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        diagnosisCode: input.diagnosisCode,
        diagnosisLabel: input.diagnosisLabel,
        bodyRegion: input.bodyRegion,
        laterality: input.laterality,
        episodeStatus: input.episodeStatus,
        openedAt: input.openedAt ?? new Date(),
        notes: input.notes ?? null,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        diagnosisCode: z.string().optional(),
        diagnosisLabel: z.string().optional(),
        bodyRegion: z
          .enum(["KNEE", "HIP", "SHOULDER", "SPINE", "FOOT_ANKLE", "HAND_WRIST", "OTHER"])
          .optional(),
        laterality: z.enum(["LEFT", "RIGHT", "BILATERAL"]).optional(),
        episodeStatus: z
          .enum(["ACTIVE", "RECOVERED", "CHRONIC", "SURGICAL", "DISCHARGED"])
          .optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const db = getDb();
      const [e] = await db
        .select()
        .from(clinicalEpisodes)
        .where(eq(clinicalEpisodes.id, input.id))
        .limit(1);
      if (!e) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      assertClinicAccess(ctx, e.clinicId);
      const { id, ...rest } = input;
      const patch: Record<string, unknown> = {};
      if (rest.diagnosisCode !== undefined) patch.diagnosisCode = rest.diagnosisCode;
      if (rest.diagnosisLabel !== undefined) patch.diagnosisLabel = rest.diagnosisLabel;
      if (rest.bodyRegion !== undefined) patch.bodyRegion = rest.bodyRegion;
      if (rest.laterality !== undefined) patch.laterality = rest.laterality;
      if (rest.episodeStatus !== undefined) patch.episodeStatus = rest.episodeStatus;
      if (rest.notes !== undefined) patch.notes = rest.notes;
      await db.update(clinicalEpisodes).set(patch as never).where(eq(clinicalEpisodes.id, id));
      return { ok: true as const };
    }),

  close: protectedProcedure
    .input(z.object({ id: z.string().uuid(), closedAt: z.coerce.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const db = getDb();
      const [e] = await db
        .select()
        .from(clinicalEpisodes)
        .where(eq(clinicalEpisodes.id, input.id))
        .limit(1);
      if (!e) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      assertClinicAccess(ctx, e.clinicId);
      await db
        .update(clinicalEpisodes)
        .set({ closedAt: input.closedAt ?? new Date(), episodeStatus: "DISCHARGED" })
        .where(eq(clinicalEpisodes.id, input.id));
      return { ok: true as const };
    }),
});
