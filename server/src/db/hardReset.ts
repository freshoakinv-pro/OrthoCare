import "dotenv/config";
import mysql from "mysql2/promise";

async function hardReset() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const connection = await mysql.createConnection(url);

  console.log("Dropping all tables...");
  await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
  await connection.execute("DROP TABLE IF EXISTS `__drizzle_migrations`");
  await connection.execute("DROP TABLE IF EXISTS `appointments`");
  await connection.execute("DROP TABLE IF EXISTS `clinical_episodes`");
  await connection.execute("DROP TABLE IF EXISTS `clinical_notes`");
  await connection.execute("DROP TABLE IF EXISTS `clinics`");
  await connection.execute("DROP TABLE IF EXISTS `notification_logs`");
  await connection.execute("DROP TABLE IF EXISTS `patients`");
  await connection.execute("DROP TABLE IF EXISTS `prom_questions`");
  await connection.execute("DROP TABLE IF EXISTS `prom_schedules`");
  await connection.execute("DROP TABLE IF EXISTS `prom_submissions`");
  await connection.execute("DROP TABLE IF EXISTS `prom_types`");
  await connection.execute("DROP TABLE IF EXISTS `refresh_tokens`");
  await connection.execute("DROP TABLE IF EXISTS `users`");
  await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
  await connection.end();
  console.log("All tables dropped. Redeploy the web service now.");
}

hardReset().catch((e) => {
  console.error(e);
  process.exit(1);
});
