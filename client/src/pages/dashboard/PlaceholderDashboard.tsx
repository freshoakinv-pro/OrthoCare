import { useParams, Navigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

export default function PlaceholderDashboard() {
  const { roleKey } = useParams();
  const me = trpc.auth.me.useQuery();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/auth/login";
  };

  if (me.isLoading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--color-mist)" }}>
        Loading…
      </div>
    );
  }

  if (me.isError || !me.data) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div style={{ padding: 32, maxWidth: 720, position: "relative", zIndex: 1 }}>
      <h1>Dashboard</h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
        {me.data.fullName} · {me.data.role}
        {roleKey ? ` · route:${roleKey}` : ""}
      </p>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          marginTop: 24,
          padding: "12px 20px",
          minHeight: 44,
          background: "transparent",
          border: "1px solid var(--color-bark)",
          borderRadius: 6,
          color: "var(--color-slate)",
          fontFamily: "var(--font-ui)",
          cursor: "pointer",
        }}
      >
        Log out
      </button>
    </div>
  );
}
