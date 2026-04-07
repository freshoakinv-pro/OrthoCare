import type { TimelineEvent } from "@/components/patient/JourneyTimeline";

type Detail = {
  episodes: {
    id: string;
    openedAt: Date;
    closedAt: Date | null;
    diagnosisLabel: string;
    episodeStatus: string;
  }[];
  allAppointments?: {
    id: string;
    scheduledAt: Date;
    appointmentType: string;
    status: string;
    notes: string | null;
  }[];
  latestPromScores: {
    id: string;
    submittedAt: Date;
    totalScore: number;
    scoreInterpretation: TimelineEvent["interpretation"];
  }[];
  notes?: {
    id: string;
    createdAt: Date;
    noteType: string;
    content: string;
  }[];
};

export function buildPatientTimelineEvents(q: Detail): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  for (const e of q.episodes) {
    ev.push({
      id: `eo-${e.id}`,
      at: e.openedAt,
      kind: "EPISODE_OPEN",
      label: "Episode opened",
      detail: e.diagnosisLabel,
    });
    if (e.closedAt) {
      ev.push({
        id: `ec-${e.id}`,
        at: e.closedAt,
        kind: "EPISODE_CLOSE",
        label: "Episode closed",
        detail: e.episodeStatus,
      });
    }
  }
  for (const a of q.allAppointments ?? []) {
    ev.push({
      id: `ap-${a.id}`,
      at: a.scheduledAt,
      kind: "APPOINTMENT",
      label: a.appointmentType.replace(/_/g, " "),
      appointmentType: a.appointmentType,
      detail: a.notes ?? a.status,
    });
  }
  for (const s of q.latestPromScores) {
    ev.push({
      id: `pr-${s.id}`,
      at: s.submittedAt,
      kind: "PROM",
      label: "PROM submitted",
      score: s.totalScore,
      interpretation: s.scoreInterpretation,
    });
  }
  for (const n of q.notes ?? []) {
    ev.push({
      id: `nt-${n.id}`,
      at: n.createdAt,
      kind: "NOTE",
      label: n.noteType,
      detail: n.content.slice(0, 200),
    });
  }
  return ev;
}
