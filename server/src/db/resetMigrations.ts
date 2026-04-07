import "dotenv/config";
import { getDb } from "./index.js";

async function reset() {
  const db = getDb();
  await db.execute("DROP TABLE IF EXISTS `__drizzle_migrations`");
  console.log("Migrations table dropped. Re-deploy to re-run migrations.");
  process.exit(0);
}

reset().catch(console.error);
