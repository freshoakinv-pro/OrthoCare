import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";

const PIE_COLORS = ["var(--moss)", "var(--mist)", "var(--clay)", "var(--bark)", "var(--slate)"];

export default function ClinicDashboard() {
  const q = trpc.dashboard.clinicSummary.useQuery({});

  if (q.isLoading) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Skeleton height={280} />
        <Skeleton height={240} />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return <p style={{ color: "var(--clay)" }}>Unable to load clinic dashboard.</p>;
  }

  const vol = q.data.patientVolumeByMonth.map((r) => ({
    month: r.m,
    newPatients: Number(r.c),
    returning: 0,
  }));

  const promBars = q.data.promCompletionByInstrument.map((r) => ({
    instrument: `Type ${r.promTypeId}`,
    count: Number(r.c),
  }));

  const outcomes = q.data.episodeOutcomeDistribution.map((r) => ({
    name: r.episodeStatus,
    value: Number(r.c),
  }));

  const referrals = q.data.referralSourceBreakdown.map((r) => ({
    name: r.referralSource,
    value: Number(r.c),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>Patient volume (new registrations by month)</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vol}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="newPatients" name="New" fill="var(--moss)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returning" name="Returning (placeholder)" fill="var(--stone)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>PROM completions by instrument</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={promBars}>
                <XAxis type="number" />
                <YAxis dataKey="instrument" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--moss)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Episode outcomes</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomes} dataKey="value" nameKey="name" outerRadius={80} label>
                  {outcomes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Referral sources</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={referrals} dataKey="value" nameKey="name" outerRadius={80} label>
                  {referrals.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginTop: 0 }}>Doctor activity (episodes)</h3>
        <Table>
          <THead>
            <Tr>
              <Th>Doctor ID</Th>
              <Th>Episodes</Th>
            </Tr>
          </THead>
          <TBody>
            {q.data.doctorEpisodeCounts.map((d) => (
              <Tr key={d.doctorId}>
                <Td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {d.doctorId.slice(0, 8)}…
                </Td>
                <Td>{String(d.episodes)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
