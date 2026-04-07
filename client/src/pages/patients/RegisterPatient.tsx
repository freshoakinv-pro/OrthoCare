import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const regions = ["KNEE", "HIP", "SHOULDER", "SPINE", "FOOT_ANKLE", "HAND_WRIST", "OTHER"] as const;

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const doctors = trpc.dashboard.clinicDoctors.useQuery({});
  const types = trpc.proms.listTypes.useQuery();
  const reg = trpc.patients.registerWithEpisode.useMutation({
    onSuccess: (d) => navigate(`/patients/${d.patientId}`),
  });

  const [form, setForm] = useState({
    nric: "",
    fullName: "",
    dateOfBirth: "",
    gender: "",
    primaryComplaint: "KNEE" as (typeof regions)[number],
    referralSource: "GP_REFERRAL" as "GP_REFERRAL" | "SELF" | "INSURER" | "OTHER",
    insurer: "UNINSURED" as
      | "AIA"
      | "PRUDENTIAL"
      | "NTUC_INCOME"
      | "GREAT_EASTERN"
      | "OTHER"
      | "UNINSURED",
    assignedDoctorId: "",
    diagnosisCode: "",
    diagnosisLabel: "",
    bodyRegion: "KNEE" as (typeof regions)[number],
    laterality: "LEFT" as "LEFT" | "RIGHT" | "BILATERAL",
    episodeNotes: "",
    scheduleProm: false,
    promTypeId: "" as string,
    promFreq: "MONTHLY",
    promStart: "",
  });

  const progress = (step / 3) * 100;

  const submit = () => {
    reg.mutate({
      nric: form.nric,
      fullName: form.fullName,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      primaryComplaint: form.primaryComplaint,
      referralSource: form.referralSource,
      insurer: form.insurer,
      assignedDoctorId: form.assignedDoctorId,
      diagnosisCode: form.diagnosisCode,
      diagnosisLabel: form.diagnosisLabel,
      bodyRegion: form.bodyRegion,
      laterality: form.laterality,
      episodeNotes: form.episodeNotes || undefined,
      firstPromTypeId: form.scheduleProm && form.promTypeId ? Number(form.promTypeId) : undefined,
      firstPromFrequency: form.scheduleProm
        ? (form.promFreq as "ONE_TIME" | "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "QUARTERLY")
        : undefined,
      firstPromStartAt: form.scheduleProm && form.promStart ? new Date(form.promStart) : undefined,
    });
  };

  return (
    <Card style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>Register patient</h2>
      <div
        style={{
          height: 6,
          background: "var(--stone)",
          borderRadius: 999,
          marginBottom: 24,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--moss)" }} />
      </div>

      {step === 1 ? (
        <>
          <h3>Step 1 — Personal</h3>
          <label style={{ display: "block", marginBottom: 12, fontSize: "0.875rem" }}>
            Full name
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>
          <label style={{ display: "block", marginBottom: 12, fontSize: "0.875rem" }}>
            NRIC/FIN (S/T/F/G/M + 7 digits + letter)
            <Input value={form.nric} onChange={(e) => setForm({ ...form, nric: e.target.value.toUpperCase() })} />
          </label>
          <label style={{ display: "block", marginBottom: 12, fontSize: "0.875rem" }}>
            Date of birth
            <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </label>
          <label style={{ display: "block", marginBottom: 12, fontSize: "0.875rem" }}>
            Gender
            <Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
          </label>
          <Button onClick={() => setStep(2)}>Next</Button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h3>Step 2 — Clinical</h3>
          <label style={{ display: "block", marginBottom: 12 }}>
            Primary complaint
            <Select
              value={form.primaryComplaint}
              onChange={(e) =>
                setForm({ ...form, primaryComplaint: e.target.value as (typeof regions)[number] })
              }
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Referral
            <Select
              value={form.referralSource}
              onChange={(e) =>
                setForm({
                  ...form,
                  referralSource: e.target.value as typeof form.referralSource,
                })
              }
            >
              <option value="GP_REFERRAL">GP</option>
              <option value="SELF">Self</option>
              <option value="INSURER">Insurer</option>
              <option value="OTHER">Other</option>
            </Select>
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Insurer
            <Select
              value={form.insurer}
              onChange={(e) => setForm({ ...form, insurer: e.target.value as typeof form.insurer })}
            >
              {["AIA", "PRUDENTIAL", "NTUC_INCOME", "GREAT_EASTERN", "OTHER", "UNINSURED"].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Assigned doctor
            <Select
              value={form.assignedDoctorId}
              onChange={(e) => setForm({ ...form, assignedDoctorId: e.target.value })}
            >
              <option value="">Select</option>
              {(doctors.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </Select>
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h3>Step 3 — First episode</h3>
          <label style={{ display: "block", marginBottom: 12 }}>
            ICD-10 code
            <Input value={form.diagnosisCode} onChange={(e) => setForm({ ...form, diagnosisCode: e.target.value })} />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Diagnosis label
            <Input value={form.diagnosisLabel} onChange={(e) => setForm({ ...form, diagnosisLabel: e.target.value })} />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Body region
            <Select
              value={form.bodyRegion}
              onChange={(e) =>
                setForm({ ...form, bodyRegion: e.target.value as (typeof regions)[number] })
              }
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Laterality
            <Select
              value={form.laterality}
              onChange={(e) =>
                setForm({ ...form, laterality: e.target.value as typeof form.laterality })
              }
            >
              <option value="LEFT">LEFT</option>
              <option value="RIGHT">RIGHT</option>
              <option value="BILATERAL">BILATERAL</option>
            </Select>
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Notes
            <textarea
              rows={3}
              value={form.episodeNotes}
              onChange={(e) => setForm({ ...form, episodeNotes: e.target.value })}
              style={{ width: "100%", fontFamily: "var(--font-ui)" }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.scheduleProm}
              onChange={(e) => setForm({ ...form, scheduleProm: e.target.checked })}
            />
            Schedule first PROM
          </label>
          {form.scheduleProm ? (
            <>
              <Select
                value={form.promTypeId}
                onChange={(e) => setForm({ ...form, promTypeId: e.target.value })}
                style={{ marginBottom: 12 }}
              >
                <option value="">Instrument</option>
                {(types.data ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
              <Select
                value={form.promFreq}
                onChange={(e) => setForm({ ...form, promFreq: e.target.value })}
                style={{ marginBottom: 12 }}
              >
                {["ONE_TIME", "WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
              <Input
                type="datetime-local"
                value={form.promStart}
                onChange={(e) => setForm({ ...form, promStart: e.target.value })}
              />
            </>
          ) : null}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={submit} disabled={reg.isPending}>
              Complete registration
            </Button>
          </div>
          {reg.error ? <p style={{ color: "var(--clay)" }}>{reg.error.message}</p> : null}
        </>
      ) : null}
    </Card>
  );
}
