import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as trpcExpress from "@trpc/server/adapters/express";
import { runMigrations, checkDbConnection, getDb } from "./db/index.js";
import { createContext } from "./middleware/context.js";
import { appRouter } from "./root.js";
import { registerAuthHttpRoutes } from "./routes/httpAuth.js";
import { isProd } from "./lib/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
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

registerAuthHttpRoutes(app);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
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
    if (req.path.startsWith("/api") || req.path.startsWith("/trpc")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

async function main() {
  try {
    await runMigrations();
    getDb();
    console.log("Database migrations applied");
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`OrthoCare server listening on :${port}`);
  });
}

main();
