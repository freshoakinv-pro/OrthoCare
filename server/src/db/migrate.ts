import { migrate } from "drizzle-orm/mysql2/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const db = getDb();
  await migrate(db, {
    migrationsFolder: join(__dirname, "migrations"),
  });
}
