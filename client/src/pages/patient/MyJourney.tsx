import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { JourneyTimeline } from "@/components/patient/JourneyTimeline";
import { buildPatientTimelineEvents } from "@/lib/patientTimeline";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMemo } from "react";

export default function MyJourney() {
  const me = trpc.patients.me.useQuery();
  const detail = trpc.patients.getById.useQuery(
    { id: me.data?.id ?? "" },
    { enabled: !!me.data?.id },
  );

  const events = useMemo(
    () => (detail.data ? buildPatientTimelineEvents(detail.data) : []),
    [detail.data],
  );

  if (me.isLoading || detail.isLoading) return <Skeleton height={280} />;

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>Your care journey</h2>
      <p style={{ color: "var(--bark)" }}>
        A gentle timeline of your visits, assessments, and progress — you&apos;re doing the work that matters.
      </p>
      <JourneyTimeline events={events} />
    </Card>
  );
}
