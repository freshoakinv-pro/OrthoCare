# OrthoCare Orchestrator

Full-stack monorepo: **Vite + React 19** (`client/`), **Express + tRPC + Drizzle + MySQL** (`server/`), **shared types** (`shared/`), **Railway** (`railway.toml`).

## Commands

- `pnpm install` — install workspace packages  
- `pnpm run build` — build shared → server → client  
- `pnpm run start` — production server (serves `client/dist`, API under `/api`)  
- `pnpm run dev` — dev: API + Vite with proxy  
- `pnpm run db:migrate` — Drizzle migrate (also runs on server startup)  
- `pnpm run db:seed` — seed demo data; `pnpm run db:seed -- --reset` wipes and reseeds  

## Environment

Set on Railway (or `.env` locally):

- `DATABASE_URL` — MySQL connection string  
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — required in production  
- `CLIENT_ORIGIN` — browser origin for CORS (e.g. `https://your-app.up.railway.app`)  
- `PORT` — optional (Railway sets this)  

## API

- `GET /api/health` — `{ status, timestamp, db: "connected" | "error" }`  
- `POST /api/trpc/*` — tRPC (batch link); cookies: `oc_access`, `oc_refresh`  

Local Vite proxies `/api` to the server on port 3001.
