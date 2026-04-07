import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { JourneyTimeline } from "@/components/patient/JourneyTimeline";
import { buildPatientTimelineEvents } from "@/lib/patientTimeline";
import { formatSgtDateOnly, formatSgt } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";

function ageFromDob(dob: string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("overview");
  const [noteOpen, setNoteOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [soap, setSoap] = useState({ s: "", o: "", a: "", p: "" });
  const [selectedPromType, setSelectedPromType] = useState<number | "">("");
  const [freq, setFreq] = useState("MONTHLY");
  const [startAt, setStartAt] = useState("");

  const q = trpc.patients.getById.useQuery({ id: id! }, { enabled: !!id });
  const types = trpc.proms.listTypes.useQuery();
  const createNote = trpc.notes.create.useMutation({
    onSuccess: () => {
      q.refetch();
      setNoteOpen(false);
    },
  });
  const createSched = trpc.proms.createSchedule.useMutation({
    onSuccess: () => {
      q.refetch();
      setSchedOpen(false);
    },
  });

  const activeEp = useMemo(
    () => q.data?.episodes.find((e) => e.episodeStatus === "ACTIVE"),
    [q.data],
  );

  const timelineEvents = useMemo(
    () => (q.data ? buildPatientTimelineEvents(q.data) : []),
    [q.data],
  );

  type SubRow = NonNullable<typeof q.data>["latestPromScores"][number];
  const promByType = useMemo(() => {
    const m = new Map<number, SubRow[]>();
    if (!q.data) return m;
    for (const s of q.data.latestPromScores) {
      if (!m.has(s.promTypeId)) m.set(s.promTypeId, []);
      m.get(s.promTypeId)!.push(s);
    }
    return m;
  }, [q.data]);

  if (q.isLoading || !id) {
    return <Skeleton height={360} />;
  }
  if (q.isError || !q.data) {
    return <p style={{ color: "var(--clay)" }}>Patient not found.</p>;
  }

  const { patient } = q.data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <h2 style={{ marginTop: 0 }}>{patient.fullName}</h2>
        <p style={{ color: "var(--bark)" }}>
          Age {ageFromDob(patient.dateOfBirth)} · NRIC masked · {patient.primaryComplaint} ·{" "}
          {q.data.assignedDoctorName ?? "Doctor"}
        </p>
      </Card>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "episodes", label: "Episodes" },
          { id: "proms", label: "PROMs" },
          { id: "notes", label: "Notes" },
          { id: "appointments", label: "Appointments" },
        ]}
      />

      <TabPanel id="overview" active={tab}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Active episode</h3>
          {activeEp ? (
            <p>
              {activeEp.diagnosisLabel} ({activeEp.bodyRegion})
            </p>
          ) : (
            <p style={{ color: "var(--bark)" }}>No active episode.</p>
          )}
          <h4>Latest PROM scores</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {q.data.latestPromScores.slice(0, 6).map((s) => (
              <Badge key={s.id} interpretation={s.scoreInterpretation}>
                {s.promTypeId}: {s.totalScore}
              </Badge>
            ))}
          </div>
          <h4 style={{ marginTop: 24 }}>Journey</h4>
          <JourneyTimeline events={timelineEvents} />
        </Card>
      </TabPanel>

      <TabPanel id="episodes" active={tab}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Episodes</h3>
            <Button variant="ghost">Open New Episode</Button>
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>Opened</Th>
                <Th>Diagnosis</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {q.data.episodes.map((e) => (
                <Tr key={e.id}>
                  <Td>{formatSgtDateOnly(e.openedAt)}</Td>
                  <Td>{e.diagnosisLabel}</Td>
                  <Td>{e.episodeStatus}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </TabPanel>

      <TabPanel id="proms" active={tab}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>PROM trends</h3>
            <Button onClick={() => setSchedOpen(true)}>Order PROM</Button>
          </div>
          {Array.from(promByType.entries()).map(([typeId, subs]) => {
            const data = [...subs]
              .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
              .map((s) => ({
                t: formatSgtDateOnly(s.submittedAt),
                score: s.totalScore,
              }));
            return (
              <div key={typeId} style={{ marginTop: 24 }}>
                <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>Instrument #{typeId}</h4>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="var(--moss)" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
          <h4 style={{ marginTop: 24 }}>History</h4>
          <Table>
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Score</Th>
                <Th>Band</Th>
              </Tr>
            </THead>
            <TBody>
              {q.data.latestPromScores.map((s) => (
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
      </TabPanel>

      <TabPanel id="notes" active={tab}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Notes</h3>
            <Button onClick={() => setNoteOpen(true)}>Add Note</Button>
          </div>
          {q.data.notes?.map((n) => (
            <div
              key={n.id}
              style={{
                borderBottom: "1px solid var(--stone)",
                padding: "16px 0",
                whiteSpace: "pre-wrap",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--bark)" }}>
                {formatSgt(n.createdAt)} · {n.noteType}
              </div>
              {n.content}
            </div>
          ))}
        </Card>
      </TabPanel>

      <TabPanel id="appointments" active={tab}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Appointments</h3>
          <Table>
            <THead>
              <Tr>
                <Th>When</Th>
                <Th>Type</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {(q.data.allAppointments ?? []).map((a) => (
                <Tr key={a.id}>
                  <Td>{formatSgt(a.scheduledAt)}</Td>
                  <Td>{a.appointmentType}</Td>
                  <Td>{a.status}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </TabPanel>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="SOAP note">
        <label style={{ display: "block", marginBottom: 8 }}>Subjective</label>
        <textarea
          value={soap.s}
          onChange={(e) => setSoap({ ...soap, s: e.target.value })}
          rows={3}
          style={{ width: "100%", marginBottom: 12, fontFamily: "var(--font-ui)" }}
        />
        <label style={{ display: "block", marginBottom: 8 }}>Objective</label>
        <textarea
          value={soap.o}
          onChange={(e) => setSoap({ ...soap, o: e.target.value })}
          rows={3}
          style={{ width: "100%", marginBottom: 12, fontFamily: "var(--font-ui)" }}
        />
        <label style={{ display: "block", marginBottom: 8 }}>Assessment</label>
        <textarea
          value={soap.a}
          onChange={(e) => setSoap({ ...soap, a: e.target.value })}
          rows={2}
          style={{ width: "100%", marginBottom: 12, fontFamily: "var(--font-ui)" }}
        />
        <label style={{ display: "block", marginBottom: 8 }}>Plan</label>
        <textarea
          value={soap.p}
          onChange={(e) => setSoap({ ...soap, p: e.target.value })}
          rows={2}
          style={{ width: "100%", marginBottom: 12, fontFamily: "var(--font-ui)" }}
        />
        <Button
          onClick={() => {
            if (!activeEp) return;
            createNote.mutate({
              patientId: patient.id,
              episodeId: activeEp.id,
              noteType: "SOAP",
              content: "SOAP",
              soap: {
                subjective: soap.s,
                objective: soap.o,
                assessment: soap.a,
                plan: soap.p,
              },
            });
          }}
        >
          Save
        </Button>
      </Modal>

      <Modal open={schedOpen} onClose={() => setSchedOpen(false)} title="Schedule PROM">
        <Select
          value={selectedPromType === "" ? "" : String(selectedPromType)}
          onChange={(e) => setSelectedPromType(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Select instrument</option>
          {(types.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select value={freq} onChange={(e) => setFreq(e.target.value)} style={{ marginTop: 12 }}>
          {["ONE_TIME", "WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY"].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        <Input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          style={{ marginTop: 12 }}
        />
        <Button
          style={{ marginTop: 16 }}
          onClick={() => {
            if (!activeEp || selectedPromType === "" || !startAt) return;
            createSched.mutate({
              patientId: patient.id,
              episodeId: activeEp.id,
              promTypeId: selectedPromType as number,
              frequency: freq as "ONE_TIME" | "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "QUARTERLY",
              startAt: new Date(startAt),
            });
          }}
        >
          Create schedule
        </Button>
      </Modal>
    </div>
  );
}
