import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as schema from "./schema.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool: mysql.Pool | null = null;
let dbInstance: MySql2Database<typeof schema> | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = mysql.createPool(url);
  }
  return pool;
}

export function getDb(): MySql2Database<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema, mode: "default" });
  }
  return dbInstance;
}

export async function runMigrations(): Promise<void> {
  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(__dirname, "migrations") });
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    const p = getPool();
    const conn = await p.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch {
    return false;
  }
}
