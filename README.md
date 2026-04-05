# OrthoCare Orchestrator

## Step 1 (current)

pnpm monorepo with `client/`, `server/`, `shared/`, plus `railway.toml` for Railway (Nixpacks).

- **Build:** `pnpm install && pnpm run build`
- **Start:** `pnpm run start` (Express on `PORT`, default 3001)
- **Health:** `GET /api/health` → `{ status, timestamp, db }` (`db` is `"error"` until a database is wired in a later step)

Local dev: `pnpm run dev` (Vite + server with hot reload).
