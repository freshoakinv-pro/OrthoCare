import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { patientsRouter } from "./routers/patients.js";
import { appointmentsRouter } from "./routers/appointments.js";
import { episodesRouter } from "./routers/episodes.js";
import { promsRouter } from "./routers/proms.js";
import { notesRouter } from "./routers/notes.js";
import { analyticsRouter } from "./routers/analytics.js";
import { dashboardRouter } from "./routers/dashboard.js";

export const appRouter = router({
  auth: authRouter,
  patients: patientsRouter,
  appointments: appointmentsRouter,
  episodes: episodesRouter,
  proms: promsRouter,
  notes: notesRouter,
  analytics: analyticsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
