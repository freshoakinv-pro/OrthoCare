import { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@orthocare/shared";

const navByRole: Record<UserRole, { to: string; label: string }[]> = {
  MSO_ADMIN: [
    { to: "/admin", label: "Dashboard" },
    { to: "/clinics", label: "All Clinics" },
    { to: "/analytics", label: "Analytics" },
    { to: "/settings", label: "Settings" },
  ],
  CLINIC_ADMIN: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "Patients" },
    { to: "/appointments", label: "Appointments" },
    { to: "/proms", label: "PROMs" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" },
  ],
  CLINIC_DOCTOR: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "My Patients" },
    { to: "/appointments", label: "Appointments" },
    { to: "/proms", label: "PROMs" },
    { to: "/notes", label: "Notes" },
  ],
  CLINIC_USER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "Patients" },
    { to: "/appointments", label: "Appointments" },
    { to: "/schedule", label: "Schedule" },
  ],
  PATIENT: [
    { to: "/my-journey", label: "My Journey" },
    { to: "/my-scores", label: "My Scores" },
    { to: "/my-appointments", label: "Appointments" },
    { to: "/my-pending-proms", label: "Complete PROMs" },
  ],
};

export function AppShell() {
  const navigate = useNavigate();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const role = me.data?.role as UserRole | undefined;

  const doctorQ = trpc.dashboard.doctorSummary.useQuery(
    {},
    { enabled: role === "CLINIC_DOCTOR" && !!me.data },
  );
  const schedulesQ = trpc.proms.getSchedules.useQuery(
    {},
    { enabled: (role === "CLINIC_ADMIN" || role === "CLINIC_USER") && !!me.data },
  );

  const overdue = useMemo(() => {
    if (!role) return 0;
    if (role === "CLINIC_DOCTOR") {
      return doctorQ.data?.pendingPromSchedules?.length ?? 0;
    }
    if (role === "CLINIC_ADMIN" || role === "CLINIC_USER") {
      const now = Date.now();
      return (schedulesQ.data ?? []).filter(
        (s: { nextDueAt: Date }) => new Date(s.nextDueAt).getTime() <= now,
      ).length;
    }
    return 0;
  }, [role, doctorQ.data, schedulesQ.data]);

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate("/login", { replace: true });
    },
  });

  if (me.isLoading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--mist)" }} aria-busy>
        Loading…
      </div>
    );
  }

  if (me.isError || !me.data || !role) {
    navigate("/login", { replace: true });
    return null;
  }

  const items = navByRole[role] ?? [];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100%",
        position: "relative",
        zIndex: 1,
      }}
    >
      <aside
        style={{
          background: "var(--slate)",
          color: "var(--sand)",
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(245,240,232,0.15)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600 }}>
            OrthoCare
          </div>
          <div style={{ fontSize: "0.7rem", opacity: 0.85, marginTop: 4 }}>by Inflexion Health</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 0" }}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={
                item.to === "/dashboard" ||
                item.to === "/admin" ||
                item.to === "/my-journey" ||
                item.to === "/my-scores" ||
                item.to === "/my-appointments" ||
                item.to === "/my-pending-proms" ||
                item.to === "/proms"
              }
              style={({ isActive }: { isActive: boolean }) => ({
                padding: "12px 20px",
                textDecoration: "none",
                color: "var(--sand)",
                borderLeft: isActive ? "3px solid var(--moss)" : "3px solid transparent",
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                fontSize: "0.9375rem",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: "1px solid var(--stone)",
            background: "var(--linen)",
          }}
        >
          <div style={{ fontFamily: "var(--font-ui)", color: "var(--slate)", fontWeight: 500 }}>
            Inflexion Orthopaedic Centre
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              type="button"
              aria-label="Notifications"
              className="oc-focus-ring"
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--slate)",
                padding: 8,
              }}
            >
              <Bell size={18} strokeWidth={1.5} />
              {overdue > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    background: "var(--clay)",
                    color: "var(--linen)",
                    fontSize: "0.65rem",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {overdue > 9 ? "9+" : overdue}
                </span>
              ) : null}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={me.data.fullName} />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{me.data.fullName}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--bark)" }}>{me.data.role}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("orthocare_authenticated");
                }
                logout.mutate();
              }}
              style={{ minHeight: 40, padding: "8px 14px" }}
            >
              Log out
            </Button>
          </div>
        </header>
        <main style={{ flex: 1, padding: 24, background: "var(--sand)", overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
