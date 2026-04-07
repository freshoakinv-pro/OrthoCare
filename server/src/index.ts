import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext } from "./middleware/context.js";
import { appRouter } from "./root.js";
import { runMigrations } from "./db/migrate.js";
import { checkDbConnection, getDb } from "./db/index.js";
import { seedDatabase } from "./db/seed.js";
import { isProd } from "./lib/env.js";
import { startReminderJob } from "./jobs/reminderJob.js";

let ready = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  if (!ready) {
    return res.status(503).json({
      status: "starting",
      timestamp: new Date().toISOString(),
    });
  }
  const ts = new Date().toISOString();
  try {
    const ok = await checkDbConnection();
    return res.status(ok ? 200 : 503).json({
      status: ok ? "ok" : "degraded",
      timestamp: ts,
      db: ok ? "connected" : "error",
    });
  } catch {
    return res.status(503).json({
      status: "degraded",
      timestamp: ts,
      db: "error",
    });
  }
});

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => createContext({ req, res }),
    onError({ error, path, type }) {
      if (isProd) {
        console.error("[tRPC]", type, path, error.message);
      } else {
        console.error("[tRPC]", type, path, error);
      }
    },
  }),
);

if (isProd) {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

async function main() {
  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`OrthoCare Orchestrator listening on :${port}`);
      resolve();
    });
  });

  try {
    getDb();
    await runMigrations();
    console.log("Migrations applied");
    await seedDatabase({ reset: false });
    ready = true;
    startReminderJob();
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}

main();
