import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { formatSgt } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";

const TYPE_COLORS: Record<string, string> = {
  INITIAL_CONSULT: "var(--slate)",
  FOLLOW_UP: "var(--mist)",
  PROCEDURE: "var(--clay)",
  PHYSIO: "var(--moss)",
  DISCHARGE: "var(--bark)",
};

export default function DoctorDashboard() {
  const q = trpc.dashboard.doctorSummary.useQuery({});

  if (q.isLoading) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Skeleton height={120} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return <p style={{ color: "var(--clay)" }}>Unable to load dashboard.</p>;
  }

  const { todayAppointments, flaggedPatients, activeEpisodeCount, recentPromSubmissions } =
    q.data;

  const donutData = [
    { name: "Active episodes", value: activeEpisodeCount },
    { name: "Recent activity", value: Math.max(recentPromSubmissions.length, 1) },
  ];
  const COLORS = ["var(--moss)", "var(--stone)"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Button variant="primary">Order PROM</Button>
        <Button variant="ghost">Add Note</Button>
        <Button variant="ghost">New Appointment</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Today&apos;s appointments</h3>
          {todayAppointments.length === 0 ? (
            <p style={{ color: "var(--bark)" }}>No appointments today.</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Time</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                </Tr>
              </THead>
              <TBody>
                {todayAppointments.map((a) => (
                  <Tr key={a.id}>
                    <Td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      {formatSgt(a.scheduledAt)}
                    </Td>
                    <Td>
                      <Badge>{a.appointmentType}</Badge>
                    </Td>
                    <Td>{a.status}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card
          style={
            flaggedPatients.length
              ? { borderLeft: "4px solid var(--clay)" }
              : undefined
          }
        >
          <h3 style={{ marginTop: 0 }}>Flagged patients</h3>
          {flaggedPatients.length === 0 ? (
            <p style={{ color: "var(--bark)" }}>No flags.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20, color: "var(--clay)" }}>
              {flaggedPatients.map((f) => (
                <li key={f.patientId}>
                  Patient <span style={{ fontFamily: "var(--font-mono)" }}>{f.patientId.slice(0, 8)}…</span>{" "}
                  — {f.reason}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Episode overview</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70}>
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginTop: 0 }}>Recent PROM submissions</h3>
        {recentPromSubmissions.length === 0 ? (
          <p style={{ color: "var(--bark)" }}>No recent submissions.</p>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Patient</Th>
                <Th>Score</Th>
                <Th>Band</Th>
                <Th>When</Th>
              </Tr>
            </THead>
            <TBody>
              {recentPromSubmissions.map((s) => (
                <Tr key={s.id}>
                  <Td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    {s.patientId.slice(0, 8)}…
                  </Td>
                  <Td>{s.totalScore}</Td>
                  <Td>
                    <Badge interpretation={s.scoreInterpretation}>{s.scoreInterpretation}</Badge>
                  </Td>
                  <Td>{formatSgt(s.submittedAt)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <div style={{ fontSize: "0.75rem", color: "var(--mist)" }}>
        Appointment colours:{" "}
        {Object.entries(TYPE_COLORS).map(([k, c]) => (
          <span key={k} style={{ marginRight: 12 }}>
            <span style={{ color: c }}>●</span> {k}
          </span>
        ))}
      </div>
    </div>
  );
}
