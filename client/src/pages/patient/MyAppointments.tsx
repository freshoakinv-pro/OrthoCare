import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { formatSgt } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MyAppointments() {
  const q = trpc.appointments.list.useQuery({});

  if (q.isLoading) return <Skeleton height={200} />;

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>Your appointments</h2>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {(q.data ?? []).map((a) => (
          <li key={a.id} style={{ marginBottom: 12 }}>
            <strong>{a.appointmentType.replace(/_/g, " ")}</strong> — {formatSgt(a.scheduledAt)} ({a.status})
          </li>
        ))}
      </ul>
    </Card>
  );
}
