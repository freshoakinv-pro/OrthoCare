# OrthoCare Orchestrator

## Monorepo scaffold

pnpm workspace with `client/` (Vite + React 19), `server/` (Express), `shared/` (shared types), and `railway.toml` for Railway (Nixpacks). Folder layout matches the OrthoCare Orchestrator plan (components, pages, server routers/db/middleware/services).

- **Build:** `pnpm install && pnpm run build`
- **Start:** `pnpm run start` (Express on `PORT`, default 3001)
- **Health:** `GET /api/health` → `{ status, timestamp, db }` (`db` is `"error"` until a database is wired in a later step)

Local dev: `pnpm run dev` (Vite + server with hot reload).
