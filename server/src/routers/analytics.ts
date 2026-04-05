import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import {
  clinicalEpisodes,
  clinics,
  patients,
  promSubmissions,
} from "../db/schema.js";
import { requireRole } from "../middleware/rbac.js";

export const analyticsRouter = router({
  crossClinicSummary: protectedProcedure.query(async ({ ctx }) => {
    requireRole(ctx, "MSO_ADMIN");
    const db = getDb();
    const clinicRows = await db.select({ id: clinics.id, name: clinics.name }).from(clinics);

    const out: {
      clinicId: string;
      name: string;
      patientCount: number;
      promSubmissionCount: number;
    }[] = [];

    for (const c of clinicRows) {
      const [{ pc }] = await db
        .select({ pc: count() })
        .from(patients)
        .where(eq(patients.clinicId, c.id));
      const [{ sc }] = await db
        .select({ sc: count() })
        .from(promSubmissions)
        .where(eq(promSubmissions.clinicId, c.id));
      out.push({
        clinicId: c.id,
        name: c.name,
        patientCount: Number(pc),
        promSubmissionCount: Number(sc),
      });
    }
    return out;
  }),

  networkOutcomes: protectedProcedure
    .input(
      z.object({
        diagnosisCodePrefix: z.string().max(8).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireRole(ctx, "MSO_ADMIN");
      const db = getDb();
      const conds = [];
      if (input.diagnosisCodePrefix) {
        conds.push(sql`${clinicalEpisodes.diagnosisCode} LIKE ${input.diagnosisCodePrefix + "%"}`);
      }
      const where = conds.length ? and(...conds) : undefined;
      const eps = await db
        .select({
          diagnosisCode: clinicalEpisodes.diagnosisCode,
          diagnosisLabel: clinicalEpisodes.diagnosisLabel,
          patientId: clinicalEpisodes.patientId,
          clinicId: clinicalEpisodes.clinicId,
        })
        .from(clinicalEpisodes)
        .where(where);

      const byDiag = new Map<
        string,
        { label: string; submissions: { score: number; interpretation: string }[] }
      >();

      for (const e of eps) {
        const key = e.diagnosisCode;
        if (!byDiag.has(key)) {
          byDiag.set(key, { label: e.diagnosisLabel, submissions: [] });
        }
        const subs = await db
          .select({
            totalScore: promSubmissions.totalScore,
            scoreInterpretation: promSubmissions.scoreInterpretation,
          })
          .from(promSubmissions)
          .where(
            and(
              eq(promSubmissions.patientId, e.patientId),
              eq(promSubmissions.clinicId, e.clinicId),
            ),
          )
          .limit(50);
        const bucket = byDiag.get(key)!;
        for (const s of subs) {
          bucket.submissions.push({
            score: s.totalScore,
            interpretation: s.scoreInterpretation,
          });
        }
      }

      return Array.from(byDiag.entries()).map(([code, v]) => ({
        diagnosisCode: code,
        diagnosisLabel: v.label,
        submissionCount: v.submissions.length,
        meanScore:
          v.submissions.length === 0
            ? null
            : Math.round(
                v.submissions.reduce((a, b) => a + b.score, 0) / v.submissions.length,
              ),
        interpretationHistogram: v.submissions.reduce(
          (acc, s) => {
            acc[s.interpretation] = (acc[s.interpretation] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      }));
    }),
});
