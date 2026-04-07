import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { router, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import { clinicalEpisodes, clinicalNotes, patients } from "../db/schema.js";
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

export const notesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid().optional(),
        episodeId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const clinicId = getClinicId(ctx, input.clinicId);
      const db = getDb();
      const conds = [eq(clinicalNotes.clinicId, clinicId)];
      if (input.patientId) conds.push(eq(clinicalNotes.patientId, input.patientId));
      if (input.episodeId) conds.push(eq(clinicalNotes.episodeId, input.episodeId));
      return db
        .select()
        .from(clinicalNotes)
        .where(and(...conds))
        .orderBy(desc(clinicalNotes.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        patientId: z.string().uuid(),
        episodeId: z.string().uuid(),
        noteType: z.enum(["SOAP", "LETTER", "IMAGING_REVIEW", "PROCEDURE", "DISCHARGE"]),
        content: z.string().min(1),
        soap: z
          .object({
            subjective: z.string().optional(),
            objective: z.string().optional(),
            assessment: z.string().optional(),
            plan: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const clinicId = getClinicId(ctx, input.clinicId);
      const u = requireAuthUser(ctx);
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
      let content = input.content;
      if (input.soap && input.noteType === "SOAP") {
        content = JSON.stringify({
          type: "SOAP",
          ...input.soap,
        });
      }
      const id = randomUUID();
      await db.insert(clinicalNotes).values({
        id,
        clinicId,
        patientId: input.patientId,
        episodeId: input.episodeId,
        authorId: u.userId,
        noteType: input.noteType,
        content,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN", "CLINIC_ADMIN", "CLINIC_USER", "CLINIC_DOCTOR");
      const db = getDb();
      const [n] = await db.select().from(clinicalNotes).where(eq(clinicalNotes.id, input.id)).limit(1);
      if (!n) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      assertClinicAccess(ctx, n.clinicId);
      await db.update(clinicalNotes).set({ content: input.content }).where(eq(clinicalNotes.id, input.id));
      return { ok: true as const };
    }),
});
