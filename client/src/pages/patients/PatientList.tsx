import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatSgtDateOnly } from "@/lib/datetime";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PatientList() {
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const doctors = trpc.dashboard.clinicDoctors.useQuery({});
  const list = trpc.patients.list.useQuery({
    page: 1,
    pageSize: 100,
    doctorId: doctorFilter || undefined,
    episodeStatus: statusFilter
      ? (statusFilter as "ACTIVE" | "RECOVERED" | "CHRONIC" | "SURGICAL" | "DISCHARGED")
      : undefined,
  });

  const rows = useMemo(() => {
    let r = list.data?.items ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((p) => p.fullName.toLowerCase().includes(q));
    }
    if (regionFilter) {
      r = r.filter((p) => p.primaryComplaint === regionFilter);
    }
    const flagged = (p: (typeof r)[0]) =>
      p.lastPromInterpretation === "SEVERE" || p.lastPromInterpretation === "MODERATE";
    return [...r].sort((a, b) => Number(flagged(b)) - Number(flagged(a)));
  }, [list.data, search, regionFilter]);

  if (list.isLoading) {
    return <Skeleton height={400} />;
  }

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>Patients</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <Input
          placeholder="Search name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <Select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All doctors</option>
          {(doctors.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </Select>
        <Select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="">All regions</option>
          {["KNEE", "HIP", "SHOULDER", "SPINE", "FOOT_ANKLE", "HAND_WRIST", "OTHER"].map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All episode statuses</option>
          {["ACTIVE", "RECOVERED", "CHRONIC", "SURGICAL", "DISCHARGED"].map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </Select>
        <Link to="/patients/new" style={{ alignSelf: "center" }}>
          Register patient
        </Link>
      </div>
      <Table>
        <THead>
          <Tr>
            <Th>Name</Th>
            <Th>Complaint</Th>
            <Th>Doctor</Th>
            <Th>Last PROM</Th>
            <Th>Score</Th>
            <Th>Episode</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((p) => {
            const isFlagged =
              p.lastPromInterpretation === "SEVERE" || p.lastPromInterpretation === "MODERATE";
            return (
              <Tr
                key={p.id}
                style={
                  isFlagged
                    ? { borderLeft: "4px solid var(--clay)", background: "rgba(181,121,90,0.06)" }
                    : undefined
                }
              >
                <Td>
                  <Link to={`/patients/${p.id}`}>{p.fullName}</Link>
                </Td>
                <Td>
                  <Badge>{p.primaryComplaint}</Badge>
                </Td>
                <Td>{p.assignedDoctorName ?? "—"}</Td>
                <Td>
                  {p.lastPromAt ? formatSgtDateOnly(p.lastPromAt) : "—"}
                </Td>
                <Td>
                  {p.lastPromScore != null && p.lastPromInterpretation ? (
                    <Badge interpretation={p.lastPromInterpretation}>{p.lastPromScore}</Badge>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>{p.activeEpisodeStatus ?? "—"}</Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </Card>
  );
}
