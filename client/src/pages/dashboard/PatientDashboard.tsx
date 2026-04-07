import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatSgtDateOnly } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";
import { NavLink } from "react-router-dom";

export default function PatientDashboard() {
  const q = trpc.dashboard.patientSummary.useQuery({});

  if (q.isLoading) {
    return <Skeleton height={200} />;
  }

  if (q.isError || !q.data) {
    return <p style={{ color: "var(--clay)" }}>Unable to load your dashboard.</p>;
  }

  const { patient, recentScores, upcomingAppointments, promSchedules } = q.data;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const sortedScores = [...recentScores].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );
  const first = sortedScores[0];
  const last = sortedScores[sortedScores.length - 1];
  let pct = 0;
  if (first && last && first.id !== last.id) {
    pct = Math.round(((last.totalScore - first.totalScore) / Math.max(first.totalScore, 1)) * 100);
  }

  const chartData = sortedScores.slice(-8).map((s) => ({
    t: formatSgtDateOnly(s.submittedAt),
    score: s.totalScore,
  }));

  const nextDue = promSchedules
    .filter((s) => s.isActive)
    .sort((a, b) => new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime())[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <h2 style={{ fontFamily: "var(--font-display)", margin: 0 }}>
        {greet}, {patient.fullName.split(" ")[0]}. Here&apos;s how your recovery is going.
      </h2>

      <Card>
        <h3 style={{ marginTop: 0 }}>Progress</h3>
        <p style={{ color: "var(--slate)" }}>
          Your tracked outcomes have shifted by approximately{" "}
          <strong>{pct >= 0 ? "+" : ""}
          {pct}%</strong> since your first assessment in this period — keep following your care plan.
        </p>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>My PROM scores</h3>
        {chartData.length === 0 ? (
          <p style={{ color: "var(--bark)" }}>Complete an assessment to see your trend.</p>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="var(--moss)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Latest scores</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {recentScores.slice(0, 6).map((s) => (
            <Badge key={s.id} interpretation={s.scoreInterpretation}>
              {s.totalScore} · {s.scoreInterpretation}
            </Badge>
          ))}
        </div>
      </Card>

      {nextDue ? (
        <Card>
          <h3 style={{ marginTop: 0 }}>Next assessment</h3>
          <p style={{ color: "var(--bark)" }}>Due {formatSgtDateOnly(nextDue.nextDueAt)}</p>
          <NavLink to="/my-pending-proms">
            <Button>Complete PROM</Button>
          </NavLink>
        </Card>
      ) : null}

      <Card>
        <h3 style={{ marginTop: 0 }}>Upcoming appointments</h3>
        {upcomingAppointments.length === 0 ? (
          <p style={{ color: "var(--bark)" }}>None scheduled.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {upcomingAppointments.map((a) => (
              <li key={a.id}>
                {formatSgtDateOnly(a.scheduledAt)} — {a.appointmentType}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
