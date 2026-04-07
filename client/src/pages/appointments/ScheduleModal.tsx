import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";

export function ScheduleModal({
  open,
  onClose,
  defaultStart,
}: {
  open: boolean;
  onClose: () => void;
  defaultStart?: Date;
}) {
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [type, setType] = useState("FOLLOW_UP");
  const [notes, setNotes] = useState("");
  const [dt, setDt] = useState(
    defaultStart
      ? new Date(defaultStart.getTime() - defaultStart.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "",
  );

  const patients = trpc.patients.list.useQuery({ page: 1, pageSize: 200 });
  const doctors = trpc.dashboard.clinicDoctors.useQuery({});
  const create = trpc.appointments.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Schedule appointment">
      <label style={{ display: "block", marginBottom: 8 }}>Patient</label>
      <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
        <option value="">Select</option>
        {(patients.data?.items ?? []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.fullName}
          </option>
        ))}
      </Select>
      <label style={{ display: "block", marginTop: 12, marginBottom: 8 }}>Doctor</label>
      <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
        <option value="">Select</option>
        {(doctors.data ?? []).map((d) => (
          <option key={d.id} value={d.id}>
            {d.fullName}
          </option>
        ))}
      </Select>
      <label style={{ display: "block", marginTop: 12, marginBottom: 8 }}>Type</label>
      <Select value={type} onChange={(e) => setType(e.target.value)}>
        {["INITIAL_CONSULT", "FOLLOW_UP", "PROCEDURE", "PHYSIO", "DISCHARGE"].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <label style={{ display: "block", marginTop: 12, marginBottom: 8 }}>Date & time</label>
      <Input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
      <label style={{ display: "block", marginTop: 12, marginBottom: 8 }}>Notes</label>
      <textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", fontFamily: "var(--font-ui)" }}
      />
      <Button
        style={{ marginTop: 16 }}
        onClick={() => {
          if (!patientId || !doctorId || !dt) return;
          create.mutate({
            patientId,
            doctorId,
            appointmentType: type as "INITIAL_CONSULT" | "FOLLOW_UP" | "PROCEDURE" | "PHYSIO" | "DISCHARGE",
            scheduledAt: new Date(dt),
            notes: notes || undefined,
          });
        }}
        disabled={create.isPending}
      >
        Create
      </Button>
    </Modal>
  );
}
