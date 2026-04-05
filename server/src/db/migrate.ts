import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(__dirname, "migrations") });
}
