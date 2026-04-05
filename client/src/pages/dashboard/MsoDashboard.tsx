import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MsoDashboard() {
  const summary = trpc.analytics.crossClinicSummary.useQuery();
  const outcomes = trpc.analytics.networkOutcomes.useQuery({});
  const [activating, setActivating] = useState<string | null>(null);

  const trendData =
    summary.data?.map((c) => ({
      name: c.name.slice(0, 12),
      promRate: c.promSubmissionCount,
      patients: c.patientCount,
    })) ?? [];

  if (summary.isLoading) {
    return <Skeleton height={320} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>Cross-clinic comparison</h3>
        <Table>
          <THead>
            <Tr>
              <Th>Clinic</Th>
              <Th>Patients</Th>
              <Th>PROM submissions</Th>
              <Th>Activation</Th>
            </Tr>
          </THead>
          <TBody>
            {(summary.data ?? []).map((c) => (
              <Tr key={c.clinicId}>
                <Td>{c.name}</Td>
                <Td>{c.patientCount}</Td>
                <Td>{c.promSubmissionCount}</Td>
                <Td>
                  <Button
                    variant="ghost"
                    style={{ minHeight: 36, padding: "6px 12px", fontSize: "0.8rem" }}
                    disabled={!!activating}
                    onClick={() => {
                      setActivating(c.clinicId);
                      setTimeout(() => setActivating(null), 600);
                    }}
                  >
                    Toggle active
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Network PROM activity (by clinic)</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--stone)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="promRate" name="PROM count" stroke="var(--moss)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Aggregated outcomes by diagnosis</h3>
        {outcomes.isLoading ? (
          <Skeleton height={120} />
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Code</Th>
                <Th>Label</Th>
                <Th>Submissions</Th>
                <Th>Mean score</Th>
              </Tr>
            </THead>
            <TBody>
              {(outcomes.data ?? []).map((o) => (
                <Tr key={o.diagnosisCode}>
                  <Td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{o.diagnosisCode}</Td>
                  <Td>{o.diagnosisLabel}</Td>
                  <Td>{o.submissionCount}</Td>
                  <Td>{o.meanScore ?? "—"}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
