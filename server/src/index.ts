import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === "production";

app.get("/api/health", (_req, res) => {
  const ts = new Date().toISOString();
  res.json({
    status: "ok",
    timestamp: ts,
    db: "error",
  });
});

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

app.listen(port, () => {
  console.log(`OrthoCare Orchestrator listening on :${port}`);
});
