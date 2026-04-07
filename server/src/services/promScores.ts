import { promTypes } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";

export type Interpretation =
  | "SEVERE"
  | "MODERATE"
  | "MILD"
  | "GOOD"
  | "EXCELLENT";

function oksOhsInterpretation(total: number): Interpretation {
  if (total <= 19) return "SEVERE";
  if (total <= 29) return "MODERATE";
  if (total <= 39) return "MILD";
  if (total <= 43) return "GOOD";
  return "EXCELLENT";
}

function odiInterpretation(pct: number): Interpretation {
  if (pct <= 20) return "GOOD";
  if (pct <= 40) return "MILD";
  if (pct <= 60) return "MODERATE";
  return "SEVERE";
}

function quickDashInterpretation(score: number): Interpretation {
  if (score <= 20) return "EXCELLENT";
  if (score <= 40) return "GOOD";
  if (score <= 60) return "MILD";
  if (score <= 80) return "MODERATE";
  return "SEVERE";
}

function vasInterpretation(v: number): Interpretation {
  if (v <= 3) return "GOOD";
  if (v <= 6) return "MILD";
  if (v <= 8) return "MODERATE";
  return "SEVERE";
}

function koosHoosInterpretation(score100: number): Interpretation {
  if (score100 >= 85) return "EXCELLENT";
  if (score100 >= 70) return "GOOD";
  if (score100 >= 55) return "MILD";
  if (score100 >= 40) return "MODERATE";
  return "SEVERE";
}

export async function computePromScore(
  promTypeCode: string,
  itemScores: number[],
): Promise<{ totalScore: number; interpretation: Interpretation }> {
  const db = getDb();
  const [pt] = await db
    .select()
    .from(promTypes)
    .where(eq(promTypes.code, promTypeCode))
    .limit(1);
  if (!pt) throw new Error("Unknown PROM type");

  if (promTypeCode === "OXFORD_KNEE" || promTypeCode === "OXFORD_HIP") {
    const total = itemScores.reduce((a, b) => a + b, 0);
    return { totalScore: total, interpretation: oksOhsInterpretation(total) };
  }

  if (promTypeCode === "ODI") {
    const sum = itemScores.reduce((a, b) => a + b, 0);
    const pct = Math.round((sum / 50) * 100);
    return { totalScore: pct, interpretation: odiInterpretation(pct) };
  }

  if (promTypeCode === "QUICKDASH") {
    const n = itemScores.length;
    const sum = itemScores.reduce((a, b) => a + b, 0);
    const score = Math.round(((sum / n - 1) * 25 + Number.EPSILON) * 100) / 100;
    const intScore = Math.round(score);
    return { totalScore: intScore, interpretation: quickDashInterpretation(intScore) };
  }

  if (promTypeCode === "VAS_PAIN") {
    const v = itemScores[0] ?? 0;
    return { totalScore: v, interpretation: vasInterpretation(v) };
  }

  if (promTypeCode === "KOOS12" || promTypeCode === "HOOS12") {
    const sum = itemScores.reduce((a, b) => a + b, 0);
    const max = itemScores.length * 4;
    const score100 = max === 0 ? 0 : Math.round((sum / max) * 100);
    return { totalScore: score100, interpretation: koosHoosInterpretation(score100) };
  }

  const sum = itemScores.reduce((a, b) => a + b, 0);
  return { totalScore: sum, interpretation: "MODERATE" };
}

export function advanceNextDue(
  from: Date,
  frequency: "ONE_TIME" | "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "QUARTERLY",
): Date | null {
  if (frequency === "ONE_TIME") return null;
  const d = new Date(from.getTime());
  switch (frequency) {
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "FORTNIGHTLY":
      d.setDate(d.getDate() + 14);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      break;
    default:
      return null;
  }
  return d;
}
