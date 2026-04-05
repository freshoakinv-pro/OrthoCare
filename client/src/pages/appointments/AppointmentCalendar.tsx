import { Fragment, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { ScheduleModal } from "./ScheduleModal";
import { formatSgt } from "@/lib/datetime";

const SLOT_MIN = 30;
const START_H = 8;
const END_H = 19;

const typeColor: Record<string, string> = {
  INITIAL_CONSULT: "var(--slate)",
  FOLLOW_UP: "var(--mist)",
  PROCEDURE: "var(--clay)",
  PHYSIO: "var(--moss)",
  DISCHARGE: "var(--bark)",
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function AppointmentCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>();
  const [popover, setPopover] = useState<{ id: string; x: number; y: number } | null>(null);

  const from = weekStart;
  const to = new Date(weekStart);
  to.setDate(to.getDate() + 7);

  const list = trpc.appointments.list.useQuery({
    from,
    to,
  });

  const slots = useMemo(() => {
    const rows: { hour: number; minute: number; label: string }[] = [];
    for (let h = START_H; h < END_H; h++) {
      for (let m = 0; m < 60; m += SLOT_MIN) {
        rows.push({
          hour: h,
          minute: m,
          label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        });
      }
    }
    return rows;
  }, []);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const appts = list.data ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Week view</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="oc-focus-ring"
            style={{ border: "1px solid var(--bark)", background: "var(--linen)", padding: "8px 12px", borderRadius: 6 }}
            onClick={() => {
              const n = new Date(weekStart);
              n.setDate(n.getDate() - 7);
              setWeekStart(n);
            }}
          >
            Prev
          </button>
          <button
            type="button"
            className="oc-focus-ring"
            style={{ border: "1px solid var(--bark)", background: "var(--linen)", padding: "8px 12px", borderRadius: 6 }}
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Today
          </button>
          <button
            type="button"
            className="oc-focus-ring"
            style={{ border: "1px solid var(--bark)", background: "var(--linen)", padding: "8px 12px", borderRadius: 6 }}
            onClick={() => {
              const n = new Date(weekStart);
              n.setDate(n.getDate() + 7);
              setWeekStart(n);
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)", gap: 0, fontSize: "0.75rem" }}>
        <div />
        {days.map((d) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div
              key={d.toISOString()}
              style={{
                textAlign: "center",
                padding: 8,
                borderLeft: isToday ? "3px solid var(--moss)" : "1px solid var(--stone)",
                fontWeight: isToday ? 600 : 400,
              }}
            >
              {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          );
        })}

        {slots.map((slot) => (
          <Fragment key={slot.label}>
            <div
              style={{
                padding: "4px 6px",
                borderTop: "1px solid var(--stone)",
                color: "var(--bark)",
              }}
            >
              {slot.label}
            </div>
            {days.map((day) => {
              const cellStart = new Date(day);
              cellStart.setHours(slot.hour, slot.minute, 0, 0);
              const cellEnd = new Date(cellStart.getTime() + SLOT_MIN * 60000);
              const here = appts.filter((a) => {
                const t = new Date(a.scheduledAt);
                return t >= cellStart && t < cellEnd;
              });
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div
                  key={`${day.toISOString()}-${slot.label}`}
                  style={{
                    minHeight: 36,
                    borderTop: "1px solid var(--stone)",
                    borderLeft: isToday ? "3px solid var(--moss)" : "1px solid var(--stone)",
                    position: "relative",
                    padding: 2,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSlotStart(cellStart);
                    setModalOpen(true);
                  }}
                >
                  {here.map((a) => (
                    <div
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopover({ id: a.id, x: e.clientX, y: e.clientY });
                      }}
                      style={{
                        fontSize: "0.65rem",
                        padding: "2px 4px",
                        borderRadius: 4,
                        background: typeColor[a.appointmentType] ?? "var(--slate)",
                        color: "var(--linen)",
                        marginBottom: 2,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.appointmentType}
                    </div>
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      <ScheduleModal open={modalOpen} onClose={() => setModalOpen(false)} defaultStart={slotStart} />

      {popover ? (
        <div
          style={{
            position: "fixed",
            left: popover.x,
            top: popover.y,
            background: "var(--linen)",
            border: "1px solid var(--bark)",
            padding: 12,
            borderRadius: 8,
            zIndex: 200,
            boxShadow: "var(--shadow-card)",
          }}
        >
          {(() => {
            const a = appts.find((x) => x.id === popover.id);
            if (!a) return null;
            return (
              <>
                <div style={{ fontWeight: 600 }}>{a.appointmentType}</div>
                <div style={{ fontSize: "0.8rem" }}>{formatSgt(a.scheduledAt)}</div>
                <div style={{ fontSize: "0.8rem" }}>{a.status}</div>
                <button type="button" style={{ marginTop: 8, border: "none", background: "none", color: "var(--moss)", cursor: "pointer" }} onClick={() => setPopover(null)}>
                  Close
                </button>
              </>
            );
          })()}
        </div>
      ) : null}
    </Card>
  );
}
