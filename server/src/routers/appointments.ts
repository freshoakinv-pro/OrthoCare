import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { router, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import { appointments, patients } from "../db/schema.js";
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

export const appointmentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        doctorId: z.string().uuid().optional(),
        status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR", "PATIENT");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const u = requireAuthUser(ctx);
      const conds = [eq(appointments.clinicId, clinicId)];
      if (input.from) conds.push(gte(appointments.scheduledAt, input.from));
      if (input.to) conds.push(lte(appointments.scheduledAt, input.to));
      if (input.doctorId) conds.push(eq(appointments.doctorId, input.doctorId));
      if (input.status) conds.push(eq(appointments.status, input.status));
      if (u.role === "CLINIC_DOCTOR") {
        conds.push(eq(appointments.doctorId, u.userId));
      }
      if (u.role === "PATIENT") {
        const [pat] = await db
          .select({ id: patients.id })
          .from(patients)
          .where(and(eq(patients.userId, u.userId), eq(patients.clinicId, clinicId)))
          .limit(1);
        if (!pat) throw new TRPCError({ code: "FORBIDDEN", message: "No patient profile" });
        conds.push(eq(appointments.patientId, pat.id));
      }
      return db
        .select()
        .from(appointments)
        .where(and(...conds))
        .orderBy(asc(appointments.scheduledAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid(),
        doctorId: z.string().uuid(),
        appointmentType: z.enum([
          "INITIAL_CONSULT",
          "FOLLOW_UP",
          "PROCEDURE",
          "PHYSIO",
          "DISCHARGE",
        ]),
        scheduledAt: z.coerce.date(),
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
      await db.insert(appointments).values({
        id,
        clinicId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentType: input.appointmentType,
        status: "SCHEDULED",
        scheduledAt: input.scheduledAt,
        notes: input.notes ?? null,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        scheduledAt: z.coerce.date().optional(),
        status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const db = getDb();
      const [a] = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      assertClinicAccess(ctx, a.clinicId);
      const patch: Record<string, unknown> = {};
      if (input.scheduledAt) patch.scheduledAt = input.scheduledAt;
      if (input.status) patch.status = input.status;
      if (input.notes !== undefined) patch.notes = input.notes;
      await db.update(appointments).set(patch as never).where(eq(appointments.id, input.id));
      return { ok: true as const };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const db = getDb();
      const [a] = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      assertClinicAccess(ctx, a.clinicId);
      await db.update(appointments).set({ status: "CANCELLED" }).where(eq(appointments.id, input.id));
      return { ok: true as const };
    }),

  today: protectedProcedure
    .input(z.object({ clinicId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "CLINIC_DOCTOR");
      const clinicId = getClinicId(ctx, input.clinicId);
      const u = requireAuthUser(ctx);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const db = getDb();
      return db
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
    }),
});
