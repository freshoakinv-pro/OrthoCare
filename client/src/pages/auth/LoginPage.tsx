import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

const rolePaths: Record<string, string> = {
  MSO_ADMIN: "/admin/mso",
  CLINIC_ADMIN: "/dashboard/clinic-admin",
  CLINIC_USER: "/dashboard/clinic-user",
  CLINIC_DOCTOR: "/dashboard/doctor",
  PATIENT: "/portal",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const me = trpc.auth.me.useQuery(undefined, { retry: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        redirectTo?: string;
        user?: { role: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      await me.refetch();
      const to =
        data.redirectTo ??
        rolePaths[data.user?.role ?? ""] ??
        "/dashboard/doctor";
      navigate(to, { replace: true });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--color-linen)",
          border: "1px solid var(--color-bark)",
          borderRadius: 8,
          padding: 24,
          boxShadow: "0 2px 12px rgba(60,45,30,0.06)",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>OrthoCare</h1>
        <p style={{ color: "var(--color-bark)", marginTop: 0, marginBottom: 24 }}>
          Orchestrator — sign in to continue
        </p>
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              marginBottom: 8,
              color: "var(--color-slate)",
            }}
          >
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                padding: "12px 14px",
                minHeight: 44,
                fontFamily: "var(--font-ui)",
                fontSize: "1rem",
                border: "1px solid var(--color-bark)",
                borderRadius: 6,
                background: "var(--color-sand)",
                outline: "none",
              }}
            />
          </label>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              marginBottom: 16,
              marginTop: 16,
              color: "var(--color-slate)",
            }}
          >
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                padding: "12px 14px",
                minHeight: 44,
                fontFamily: "var(--font-ui)",
                fontSize: "1rem",
                border: "1px solid var(--color-bark)",
                borderRadius: 6,
                background: "var(--color-sand)",
                outline: "none",
              }}
            />
          </label>
          {error ? (
            <p style={{ color: "var(--color-clay)", fontSize: "0.875rem" }}>{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 8,
              minHeight: 48,
              border: "none",
              borderRadius: 6,
              background: "var(--color-moss)",
              color: "var(--color-linen)",
              fontFamily: "var(--font-ui)",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
