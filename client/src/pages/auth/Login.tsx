import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const redirectByRole: Record<string, string> = {
  MSO_ADMIN: "/dashboard/mso",
  CLINIC_ADMIN: "/dashboard/clinic",
  CLINIC_USER: "/dashboard/clinic-user",
  CLINIC_DOCTOR: "/dashboard/doctor",
  PATIENT: "/patient/journey",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      const me = await utils.auth.me.fetch();
      const path = redirectByRole[me.role] ?? "/dashboard/doctor";
      navigate(path, { replace: true });
    } catch {
      setError("Invalid email or password.");
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
          <Button type="submit" disabled={login.isPending} style={{ width: "100%", marginTop: 8 }}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
