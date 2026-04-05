import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { router, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import {
  appointments,
  clinicalEpisodes,
  patients,
  promSubmissions,
  users,
} from "../db/schema.js";
import { assertClinicAccess, requireAuthUser } from "../middleware/auth.js";
import { hashNric, validateNricChecksum } from "../lib/nric.js";
import { requireRole } from "../middleware/rbac.js";

function resolveClinicId(
  ctx: { user: import("../middleware/context.js").AuthUser },
  inputClinic?: string,
): string {
  const u = ctx.user;
  if (u.role === "MSO_ADMIN") {
    if (!inputClinic) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "clinicId required" });
    }
    return inputClinic;
  }
  if (!u.clinicId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No clinic" });
  }
  if (inputClinic && inputClinic !== u.clinicId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinic mismatch" });
  }
  return u.clinicId;
}

export const patientsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        doctorId: z.string().uuid().optional(),
        episodeStatus: z.enum(["ACTIVE", "RECOVERED", "CHRONIC", "SURGICAL", "DISCHARGED"]).optional(),
        includeArchived: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const clinicId = resolveClinicId(ctx, input.clinicId);
      const db = getDb();
      const offset = (input.page - 1) * input.pageSize;

      const conditions = [eq(patients.clinicId, clinicId)];
      if (!input.includeArchived) {
        conditions.push(isNull(patients.archivedAt));
      }
      const u = requireAuthUser(ctx);
      if (u.role === "CLINIC_DOCTOR") {
        conditions.push(eq(patients.assignedDoctorId, u.userId));
      } else if (input.doctorId) {
        conditions.push(eq(patients.assignedDoctorId, input.doctorId));
      }

      let patientIds: string[] | undefined;
      if (input.episodeStatus) {
        const eps = await db
          .select({ patientId: clinicalEpisodes.patientId })
          .from(clinicalEpisodes)
          .where(
            and(
              eq(clinicalEpisodes.clinicId, clinicId),
              eq(clinicalEpisodes.episodeStatus, input.episodeStatus),
            ),
          );
        patientIds = [...new Set(eps.map((e) => e.patientId))];
        if (patientIds.length === 0) {
          return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
        }
      }

      const where =
        patientIds && patientIds.length
          ? and(...conditions, inArray(patients.id, patientIds))
          : and(...conditions);

      const rows = await db
        .select()
        .from(patients)
        .where(where!)
        .orderBy(desc(patients.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      const [{ c }] = await db
        .select({ c: sql<number>`count(*)`.mapWith(Number) })
        .from(patients)
        .where(where!);

      return { items: rows, total: c, page: input.page, pageSize: input.pageSize };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [p] = await db.select().from(patients).where(eq(patients.id, input.id)).limit(1);
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Patient not found" });
      const u = requireAuthUser(ctx);
      if (u.role === "PATIENT") {
        const [self] = await db
          .select()
          .from(patients)
          .where(and(eq(patients.id, input.id), eq(patients.userId, u.userId)))
          .limit(1);
        if (!self) throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
      } else {
        assertClinicAccess(ctx, p.clinicId);
      }

      const episodes = await db
        .select()
        .from(clinicalEpisodes)
        .where(and(eq(clinicalEpisodes.patientId, p.id), eq(clinicalEpisodes.clinicId, p.clinicId)));

      const latestProm = await db
        .select()
        .from(promSubmissions)
        .where(and(eq(promSubmissions.patientId, p.id), eq(promSubmissions.clinicId, p.clinicId)))
        .orderBy(desc(promSubmissions.submittedAt))
        .limit(20);

      const upcoming = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.patientId, p.id),
            eq(appointments.clinicId, p.clinicId),
            gte(appointments.scheduledAt, new Date()),
          ),
        )
        .orderBy(asc(appointments.scheduledAt))
        .limit(10);

      return { patient: p, episodes, latestPromScores: latestProm, upcomingAppointments: upcoming };
    }),

  create: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        nric: z.string().min(9).max(9),
        fullName: z.string().min(1).max(255),
        dateOfBirth: z.string(),
        gender: z.string().min(1).max(32),
        primaryComplaint: z.enum([
          "KNEE",
          "HIP",
          "SHOULDER",
          "SPINE",
          "FOOT_ANKLE",
          "HAND_WRIST",
          "OTHER",
        ]),
        assignedDoctorId: z.string().uuid(),
        referralSource: z.enum(["GP_REFERRAL", "SELF", "INSURER", "OTHER"]),
        insurer: z.enum([
          "AIA",
          "PRUDENTIAL",
          "NTUC_INCOME",
          "GREAT_EASTERN",
          "OTHER",
          "UNINSURED",
        ]),
        userId: z.string().uuid().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      if (!validateNricChecksum(input.nric)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid NRIC checksum" });
      }
      const clinicId = resolveClinicId(ctx, input.clinicId);
      const id = randomUUID();
      const db = getDb();
      await db.insert(patients).values({
        id,
        clinicId,
        nricHash: hashNric(input.nric),
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        primaryComplaint: input.primaryComplaint,
        assignedDoctorId: input.assignedDoctorId,
        referralSource: input.referralSource,
        insurer: input.insurer,
        userId: input.userId ?? null,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        fullName: z.string().min(1).optional(),
        gender: z.string().optional(),
        primaryComplaint: z
          .enum(["KNEE", "HIP", "SHOULDER", "SPINE", "FOOT_ANKLE", "HAND_WRIST", "OTHER"])
          .optional(),
        assignedDoctorId: z.string().uuid().optional(),
        referralSource: z.enum(["GP_REFERRAL", "SELF", "INSURER", "OTHER"]).optional(),
        insurer: z
          .enum([
            "AIA",
            "PRUDENTIAL",
            "NTUC_INCOME",
            "GREAT_EASTERN",
            "OTHER",
            "UNINSURED",
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const db = getDb();
      const [p] = await db.select().from(patients).where(eq(patients.id, input.id)).limit(1);
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      assertClinicAccess(ctx, p.clinicId);
      const { id, ...rest } = input;
      const patch: Record<string, unknown> = {};
      if (rest.fullName !== undefined) patch.fullName = rest.fullName;
      if (rest.gender !== undefined) patch.gender = rest.gender;
      if (rest.primaryComplaint !== undefined) patch.primaryComplaint = rest.primaryComplaint;
      if (rest.assignedDoctorId !== undefined) patch.assignedDoctorId = rest.assignedDoctorId;
      if (rest.referralSource !== undefined) patch.referralSource = rest.referralSource;
      if (rest.insurer !== undefined) patch.insurer = rest.insurer;
      await db.update(patients).set(patch as never).where(eq(patients.id, id));
      return { ok: true as const };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN");
      const db = getDb();
      const [p] = await db.select().from(patients).where(eq(patients.id, input.id)).limit(1);
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      assertClinicAccess(ctx, p.clinicId);
      await db.update(patients).set({ archivedAt: new Date() }).where(eq(patients.id, input.id));
      return { ok: true as const };
    }),
});
