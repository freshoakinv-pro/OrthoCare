import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatSgtDateOnly } from "@/lib/datetime";

export type TimelineEvent = {
  id: string;
  at: Date;
  kind: "EPISODE_OPEN" | "EPISODE_CLOSE" | "APPOINTMENT" | "PROM" | "NOTE";
  label: string;
  detail?: string;
  appointmentType?: string;
  score?: number;
  interpretation?: "SEVERE" | "MODERATE" | "MILD" | "GOOD" | "EXCELLENT";
};

const apptColor: Record<string, string> = {
  INITIAL_CONSULT: "var(--slate)",
  FOLLOW_UP: "var(--mist)",
  PROCEDURE: "var(--clay)",
  PHYSIO: "var(--moss)",
  DISCHARGE: "var(--bark)",
};

export function JourneyTimeline({ events }: { events: TimelineEvent[] }) {
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [events],
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 12,
          borderBottom: "1px solid var(--stone)",
        }}
      >
        {sorted.map((ev) => {
          let borderColor = "var(--bark)";
          if (ev.kind === "PROM") borderColor = "var(--moss)";
          if (ev.kind === "APPOINTMENT" && ev.appointmentType) {
            borderColor = apptColor[ev.appointmentType] ?? "var(--slate)";
          }
          if (ev.kind === "EPISODE_OPEN" || ev.kind === "EPISODE_CLOSE") {
            borderColor = "var(--slate)";
          }
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => setSelected(ev)}
              className="oc-focus-ring"
              style={{
                flex: "0 0 auto",
                minWidth: 140,
                padding: 12,
                borderRadius: 8,
                border: `2px solid ${borderColor}`,
                background: "var(--linen)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "0.7rem", color: "var(--bark)" }}>
                {formatSgtDateOnly(ev.at)}
              </div>
              <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{ev.label}</div>
              {ev.score != null && ev.interpretation ? (
                <div style={{ marginTop: 6 }}>
                  <Badge interpretation={ev.interpretation}>{ev.score}</Badge>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <aside
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "min(400px, 100%)",
            height: "100%",
            background: "var(--linen)",
            borderLeft: "1px solid var(--bark)",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
            padding: 24,
            zIndex: 50,
            overflow: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            style={{
              marginBottom: 16,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--moss)",
              fontFamily: "var(--font-ui)",
            }}
          >
            Close
          </button>
          <h3 style={{ marginTop: 0 }}>{selected.label}</h3>
          <p style={{ color: "var(--bark)", fontSize: "0.875rem" }}>
            {formatSgtDateOnly(selected.at)}
          </p>
          {selected.detail ? (
            <p style={{ whiteSpace: "pre-wrap", color: "var(--slate)" }}>{selected.detail}</p>
          ) : null}
          {selected.score != null ? (
            <Badge interpretation={selected.interpretation}>{selected.score}</Badge>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
