import { migrate } from "drizzle-orm/mysql2/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const db = getDb();
  try {
    await migrate(db, {
      migrationsFolder: join(__dirname, "migrations"),
    });
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
