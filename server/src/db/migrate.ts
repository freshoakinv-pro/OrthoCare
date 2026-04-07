import { migrate } from "drizzle-orm/mysql2/migrator";
import type { RowDataPacket } from "mysql2/promise";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, getPool } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TABLES_TO_DROP_ON_BROKEN_STATE = [
  "__drizzle_migrations",
  "appointments",
  "clinical_episodes",
  "clinical_notes",
  "clinics",
  "notification_logs",
  "patients",
  "prom_questions",
  "prom_schedules",
  "prom_submissions",
  "prom_types",
  "refresh_tokens",
  "users",
] as const;

export async function runMigrations(): Promise<void> {
  const db = getDb();
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(*) as c FROM `__drizzle_migrations`",
    );
    const count = Number(rows[0]?.c ?? 0);
    if (count === 0) {
      console.log(
        "Detected empty migrations table — dropping all tables for clean migration...",
      );
      await conn.query("SET FOREIGN_KEY_CHECKS = 0");
      for (const t of TABLES_TO_DROP_ON_BROKEN_STATE) {
        await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
      }
      await conn.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("Tables dropped, running fresh migrations...");
    }
  } catch {
    // __drizzle_migrations doesn't exist at all — clean DB, proceed normally
  } finally {
    conn.release();
  }

  const migrationsFolder = join(__dirname, "migrations");
  console.log("Migrations folder:", migrationsFolder);

  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations complete");
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "ER_TABLE_EXISTS_ERROR") {
      console.log("Tables already exist, skipping migrations");
    } else {
      console.error("Migration failed:", err);
      throw err;
    }
  }
}
