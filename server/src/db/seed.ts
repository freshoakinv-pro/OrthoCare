import "dotenv/config";
import { getDb, runMigrations } from "./index.js";
import { promQuestions, promTypes } from "./schema.js";
import {
  allPromQuestionSeeds,
  allPromTypeSeeds,
} from "./promSeedData.js";

async function seed() {
  await runMigrations();
  const db = getDb();

  await db.delete(promQuestions);
  await db.delete(promTypes);

  for (const t of allPromTypeSeeds) {
    await db.insert(promTypes).values({
      code: t.code,
      name: t.name,
      applicableRegions: t.applicableRegions,
      questionCount: t.questionCount,
      minScore: t.minScore,
      maxScore: t.maxScore,
      scoreDirection: t.scoreDirection,
      description: t.description,
    });
  }

  const rows = await db.select({ id: promTypes.id, code: promTypes.code }).from(promTypes);
  const idByCode = new Map(rows.map((r) => [r.code, r.id]));

  for (const q of allPromQuestionSeeds) {
    const promTypeId = idByCode.get(q.code);
    if (!promTypeId) {
      throw new Error(`Unknown prom type code: ${q.code}`);
    }
    await db.insert(promQuestions).values({
      promTypeId,
      questionOrder: q.order,
      questionText: q.text,
      responseOptions: q.options,
      reverseScored: q.reverseScored ?? false,
    });
  }

  console.log(
    `Seeded ${allPromTypeSeeds.length} PROM types and ${allPromQuestionSeeds.length} questions.`,
  );
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
