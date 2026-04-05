import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { formatSgtDateOnly } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MyScores() {
  const dash = trpc.dashboard.patientSummary.useQuery({});

  if (dash.isLoading) return <Skeleton height={300} />;

  const scores = dash.data?.recentScores ?? [];
  const n = scores.length;
  const chartData = [...scores]
    .reverse()
    .map((s) => ({ t: formatSgtDateOnly(s.submittedAt), score: s.totalScore }));

  const first = scores[scores.length - 1];
  const last = scores[0];
  let pct = 0;
  if (first && last && first.id !== last.id) {
    pct = Math.round(((last.totalScore - first.totalScore) / Math.max(first.totalScore, 1)) * 100);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <Card>
        <h2 style={{ marginTop: 0 }}>Your scores</h2>
        <p style={{ color: "var(--bark)", fontSize: "1.05rem" }}>
          You&apos;ve completed <strong>{n}</strong> assessment{n === 1 ? "" : "s"} — every one helps your care team
          support you better.
        </p>
        <p style={{ color: "var(--moss)", fontSize: "1.1rem" }}>
          Compared to your earlier scores, you&apos;re tracking about{" "}
          <strong>{pct >= 0 ? "+" : ""}
          {pct}%</strong> — celebrate the small wins.
        </p>
      </Card>
      <Card>
        <h3 style={{ marginTop: 0 }}>Trend</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="t" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="var(--moss)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
