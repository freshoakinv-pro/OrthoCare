import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { formatSgtDateOnly } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PromSchedules() {
  const q = trpc.proms.getSchedules.useQuery({});

  if (q.isLoading) return <Skeleton height={360} />;

  const now = Date.now();
  const rows = q.data ?? [];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>PROM schedules</h2>
        <Button variant="ghost">New Schedule</Button>
      </div>
      <Table>
        <THead>
          <Tr>
            <Th>Patient</Th>
            <Th>Instrument</Th>
            <Th>Frequency</Th>
            <Th>Next due</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((s) => {
            const overdue = new Date(s.nextDueAt).getTime() < now && s.isActive;
            return (
              <Tr
                key={s.id}
                style={
                  overdue
                    ? { background: "rgba(181,121,90,0.12)" }
                    : undefined
                }
              >
                <Td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {s.patientId.slice(0, 8)}…
                </Td>
                <Td>{s.promTypeId}</Td>
                <Td>{s.frequency}</Td>
                <Td>{formatSgtDateOnly(s.nextDueAt)}</Td>
                <Td>{s.isActive ? "Active" : "Inactive"}</Td>
                <Td>
                  <Button
                    variant="ghost"
                    style={{ minHeight: 36, padding: "6px 10px", fontSize: "0.8rem" }}
                    onClick={() => console.log("[ui] reminder stub", s.id)}
                  >
                    Send Reminder
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </Card>
  );
}
