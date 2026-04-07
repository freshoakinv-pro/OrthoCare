import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatSgtDateOnly } from "@/lib/datetime";

export default function PromResults() {
  const patientsQ = trpc.patients.list.useQuery({ page: 1, pageSize: 200 });
  const typesQ = trpc.proms.listTypes.useQuery();
  const [patientId, setPatientId] = useState("");
  const [promTypeId, setPromTypeId] = useState<number | "">("");

  const results = trpc.proms.getResults.useQuery(
    { patientId, promTypeId: promTypeId === "" ? 0 : promTypeId },
    { enabled: !!patientId && promTypeId !== "" },
  );

  const chartData = (results.data ?? [])
    .slice()
    .reverse()
    .map((s) => ({ t: formatSgtDateOnly(s.submittedAt), score: s.totalScore }));

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>PROM results</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} style={{ minWidth: 200 }}>
          <option value="">Patient</option>
          {(patientsQ.data?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </Select>
        <Select
          value={promTypeId === "" ? "" : String(promTypeId)}
          onChange={(e) => setPromTypeId(e.target.value ? Number(e.target.value) : "")}
          style={{ minWidth: 200 }}
        >
          <option value="">Instrument</option>
          {(typesQ.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="t" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="var(--moss)" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--bark)" }}>
        Legend: SEVERE / MODERATE / MILD / GOOD / EXCELLENT — see score badges below.
      </p>
      <Table>
        <THead>
          <Tr>
            <Th>Date</Th>
            <Th>Score</Th>
            <Th>Interpretation</Th>
          </Tr>
        </THead>
        <TBody>
          {(results.data ?? []).map((s) => (
            <Tr key={s.id}>
              <Td>{formatSgtDateOnly(s.submittedAt)}</Td>
              <Td>{s.totalScore}</Td>
              <Td>
                <Badge interpretation={s.scoreInterpretation}>{s.scoreInterpretation}</Badge>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
