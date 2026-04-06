import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { dashboardPathForRole } from "@/lib/dashboardPath";
import type { UserRole } from "@orthocare/shared";

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const me = trpc.auth.me.useQuery(undefined, { retry: false });

  if (me.isLoading) {
    return (
      <div style={{ padding: 24, color: "var(--mist)", fontFamily: "var(--font-ui)" }} aria-busy>
        Loading…
      </div>
    );
  }

  if (!me.data) {
    return <Navigate to="/login" replace />;
  }

  const r = me.data.role as UserRole;
  if (!roles.includes(r)) {
    return <Navigate to={dashboardPathForRole(r)} replace />;
  }

  return <>{children}</>;
}
