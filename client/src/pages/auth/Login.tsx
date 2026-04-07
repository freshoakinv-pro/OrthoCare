import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, setAuthHintInStorage } from "@/hooks/useAuth";
import { dashboardPathForRole } from "@/lib/dashboardPath";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticating, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate(dashboardPathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get("unauthorized") === "1") {
      setAuthHintInStorage(false);
      setError("Your session expired. Please sign in again.");
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    }
  };

  if (user) {
    return null;
  }

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
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginTop: 0 }}>
          OrthoCare Orchestrator
        </h1>
        <p style={{ color: "var(--bark)", marginTop: 0 }}>by Inflexion Health Group</p>
        <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
          <label style={{ display: "block", marginBottom: 16, fontSize: "0.875rem" }}>
            Email
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              style={{ marginTop: 6 }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 16, fontSize: "0.875rem" }}>
            Password
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              style={{ marginTop: 6 }}
            />
          </label>
          {error ? <p style={{ color: "var(--clay)", fontSize: "0.875rem" }}>{error}</p> : null}
          <Button type="submit" disabled={isAuthenticating} style={{ width: "100%", marginTop: 8 }}>
            {isAuthenticating ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
