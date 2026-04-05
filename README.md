# OrthoCare Orchestrator

Monorepo: `client/` (Vite + React 19), `server/` (Express + tRPC + Drizzle), `shared/` (types).

**Local:** copy `.env.example` to `.env` in repo root (or set env for the server). Run `pnpm install`, `pnpm run db:migrate` with MySQL reachable, `pnpm run db:seed` for PROM catalog, then `pnpm run dev` (or `pnpm run build` + `pnpm run start`).

**Railway:** set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `CLIENT_ORIGIN` to your deployed web URL. Migrations run on server startup; use `pnpm run db:seed` once after first deploy if PROM tables are empty.