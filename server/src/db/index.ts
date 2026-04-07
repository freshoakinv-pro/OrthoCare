import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

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
