import { Link } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatSgtDateOnly } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PendingProms() {
  const due = trpc.proms.getPatientDue.useQuery({});

  if (due.isLoading) return <Skeleton height={200} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
      <h2 style={{ fontFamily: "var(--font-display)" }}>Assessments for you</h2>
      {(due.data ?? []).length === 0 ? (
        <Card>
          <p style={{ color: "var(--bark)" }}>You&apos;re all caught up — we&apos;ll let you know when the next one is due.</p>
        </Card>
      ) : (
        (due.data ?? []).map((s) => (
          <Card key={s.id}>
            <p style={{ marginTop: 0, fontWeight: 500 }}>Instrument #{s.promTypeId}</p>
            <p style={{ color: "var(--bark)", fontSize: "0.9rem" }}>Due {formatSgtDateOnly(s.nextDueAt)}</p>
            <p style={{ color: "var(--mist)", fontSize: "0.85rem" }}>About 5–15 minutes on your phone.</p>
            <Link to={`/proms/questionnaire/${s.id}`}>
              <Button style={{ marginTop: 12 }}>Start assessment</Button>
            </Link>
          </Card>
        ))
      )}
    </div>
  );
}
