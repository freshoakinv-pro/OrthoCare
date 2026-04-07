import { Navigate, Outlet, useLocation } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { dashboardPathForRole } from "@/lib/dashboardPath";
import type { UserRole } from "@orthocare/shared";

/**
 * Protects routes: requires session (auth.me).
 * Optional `roles` restricts to those roles (others → their dashboard).
 */
export function AuthGuard({ roles }: { roles?: UserRole[] }) {
  const location = useLocation();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });

  if (me.isLoading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--mist)", fontFamily: "var(--font-ui)" }}>
        Loading…
      </div>
    );
  }

  if (me.isError || !me.data) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const r = me.data.role as UserRole;
  if (roles?.length && !roles.includes(r)) {
    return <Navigate to={dashboardPathForRole(r)} replace />;
  }

  return <Outlet />;
}
