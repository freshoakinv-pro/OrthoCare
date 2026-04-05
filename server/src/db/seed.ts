import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./index.js";
import { runMigrations } from "./migrate.js";
import {
  appointments,
  clinicalEpisodes,
  clinicalNotes,
  clinics,
  notificationLogs,
  patients,
  promQuestions,
  promSchedules,
  promSubmissions,
  promTypes,
  refreshTokens,
  users,
} from "./schema.js";
import { allPromQuestionSeeds, allPromTypeSeeds } from "./promSeedData.js";
import { hashPassword } from "../services/auth.js";

function nricHash(nric: string): string {
  return createHash("sha256").update(nric.toUpperCase().trim()).digest("hex");
}

async function clearData() {
  const db = getDb();
  await db.delete(notificationLogs);
  await db.delete(clinicalNotes);
  await db.delete(promSubmissions);
  await db.delete(promSchedules);
  await db.delete(appointments);
  await db.delete(clinicalEpisodes);
  await db.delete(patients);
  await db.delete(refreshTokens);
  await db.delete(users);
  await db.delete(promQuestions);
  await db.delete(promTypes);
  await db.delete(clinics);
}

async function seed() {
  await runMigrations();
  const db = getDb();
  await clearData();

  const clinicId = randomUUID();
  await db.insert(clinics).values({
    id: clinicId,
    name: "Inflexion Orthopaedic Centre, Camden Medical Centre",
    address: "1 Orchard Blvd, #09-06/07 Camden Medical Centre, Singapore 248649",
    registrationNumber: "MOH-DEMO-001",
    isActive: true,
  });

  const msoId = randomUUID();
  const doctorId = randomUUID();
  const adminId = randomUUID();
  const pUser1 = randomUUID();
  const pUser2 = randomUUID();
  const pUser3 = randomUUID();

  await db.insert(users).values([
    {
      id: msoId,
      clinicId: null,
      email: "admin@inflexionhealth.sg",
      passwordHash: await hashPassword("Inflexion@2025"),
      role: "MSO_ADMIN",
      fullName: "MSO Administrator",
      phone: null,
      isActive: true,
    },
    {
      id: doctorId,
      clinicId,
      email: "doctor@inflexion.sg",
      passwordHash: await hashPassword("Doctor@2025"),
      role: "CLINIC_DOCTOR",
      fullName: "Dr. Demo Surgeon",
      phone: "+65 9000 0001",
      isActive: true,
    },
    {
      id: adminId,
      clinicId,
      email: "clinic@inflexion.sg",
      passwordHash: await hashPassword("Admin@2025"),
      role: "CLINIC_ADMIN",
      fullName: "Clinic Administrator",
      phone: "+65 9000 0002",
      isActive: true,
    },
    {
      id: pUser1,
      clinicId,
      email: "patient1@demo.sg",
      passwordHash: await hashPassword("Patient@2025"),
      role: "PATIENT",
      fullName: "Demo Patient One",
      phone: "+65 9123 4001",
      isActive: true,
    },
    {
      id: pUser2,
      clinicId,
      email: "patient2@demo.sg",
      passwordHash: await hashPassword("Patient@2025"),
      role: "PATIENT",
      fullName: "Demo Patient Two",
      phone: "+65 9123 4002",
      isActive: true,
    },
    {
      id: pUser3,
      clinicId,
      email: "patient3@demo.sg",
      passwordHash: await hashPassword("Patient@2025"),
      role: "PATIENT",
      fullName: "Demo Patient Three",
      phone: "+65 9123 4003",
      isActive: true,
    },
  ]);

  const pat1 = randomUUID();
  const pat2 = randomUUID();
  const pat3 = randomUUID();

  await db.insert(patients).values([
    {
      id: pat1,
      clinicId,
      userId: pUser1,
      nricHash: nricHash("S1234567D"),
      fullName: "Demo Patient One",
      dateOfBirth: "1978-05-12",
      gender: "M",
      primaryComplaint: "KNEE",
      assignedDoctorId: doctorId,
      referralSource: "GP_REFERRAL",
      insurer: "AIA",
    },
    {
      id: pat2,
      clinicId,
      userId: pUser2,
      nricHash: nricHash("T8765432F"),
      fullName: "Demo Patient Two",
      dateOfBirth: "1985-11-03",
      gender: "F",
      primaryComplaint: "HIP",
      assignedDoctorId: doctorId,
      referralSource: "SELF",
      insurer: "PRUDENTIAL",
    },
    {
      id: pat3,
      clinicId,
      userId: pUser3,
      nricHash: nricHash("F1234567X"),
      fullName: "Demo Patient Three",
      dateOfBirth: "1992-01-22",
      gender: "M",
      primaryComplaint: "SHOULDER",
      assignedDoctorId: doctorId,
      referralSource: "INSURER",
      insurer: "UNINSURED",
    },
  ]);

  const ep1 = randomUUID();
  const ep2 = randomUUID();
  const ep3 = randomUUID();
  const now = new Date();

  await db.insert(clinicalEpisodes).values([
    {
      id: ep1,
      clinicId,
      patientId: pat1,
      doctorId,
      diagnosisCode: "M17.1",
      diagnosisLabel: "Primary osteoarthritis, knee",
      bodyRegion: "KNEE",
      laterality: "RIGHT",
      episodeStatus: "ACTIVE",
      openedAt: now,
      notes: "Demo episode",
    },
    {
      id: ep2,
      clinicId,
      patientId: pat2,
      doctorId,
      diagnosisCode: "M16.1",
      diagnosisLabel: "Primary osteoarthritis, hip",
      bodyRegion: "HIP",
      laterality: "LEFT",
      episodeStatus: "ACTIVE",
      openedAt: now,
      notes: "Demo episode",
    },
    {
      id: ep3,
      clinicId,
      patientId: pat3,
      doctorId,
      diagnosisCode: "M75.1",
      diagnosisLabel: "Rotator cuff syndrome",
      bodyRegion: "SHOULDER",
      laterality: "BILATERAL",
      episodeStatus: "ACTIVE",
      openedAt: now,
      notes: "Demo episode",
    },
  ]);

  for (const t of allPromTypeSeeds) {
    await db.insert(promTypes).values({
      code: t.code,
      name: t.name,
      applicableRegions: t.applicableRegions,
      questionCount: t.questionCount,
      minScore: t.minScore,
      maxScore: t.maxScore,
      scoreDirection: t.scoreDirection,
      description: t.description,
    });
  }

  const typeRows = await db.select({ id: promTypes.id, code: promTypes.code }).from(promTypes);
  const typeIdByCode = new Map(typeRows.map((r) => [r.code, r.id]));

  for (const q of allPromQuestionSeeds) {
    const promTypeId = typeIdByCode.get(q.code);
    if (!promTypeId) throw new Error(`Missing prom type ${q.code}`);
    await db.insert(promQuestions).values({
      promTypeId,
      questionOrder: q.order,
      questionText: q.text,
      responseOptions: q.options,
      reverseScored: q.reverseScored ?? false,
    });
  }

  const oksId = typeIdByCode.get("OXFORD_KNEE")!;
  const ohsId = typeIdByCode.get("OXFORD_HIP")!;
  const vasId = typeIdByCode.get("VAS_PAIN")!;
  const qdashId = typeIdByCode.get("QUICKDASH")!;

  const qRows = await db
    .select({ id: promQuestions.id, promTypeId: promQuestions.promTypeId })
    .from(promQuestions);

  function minimalResponses(promTypeId: number, scores: number[]) {
    const ids = qRows.filter((r) => r.promTypeId === promTypeId).map((r) => r.id);
    return ids.slice(0, scores.length).map((questionId, i) => ({
      questionId,
      responseValue: String(scores[i] ?? 0),
      score: scores[i] ?? 0,
    }));
  }

  const day = (d: Date) => d.toISOString().slice(0, 10);

  await db.insert(promSubmissions).values([
    {
      id: randomUUID(),
      clinicId,
      patientId: pat1,
      promTypeId: oksId,
      episodeId: ep1,
      submittedAt: new Date(now.getTime() - 86400000 * 5),
      submissionDate: day(new Date(now.getTime() - 86400000 * 5)),
      totalScore: 35,
      scoreInterpretation: "MILD",
      responses: minimalResponses(oksId, [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1]),
      completedBy: "PATIENT",
      completionMethod: "WEB",
    },
    {
      id: randomUUID(),
      clinicId,
      patientId: pat1,
      promTypeId: vasId,
      episodeId: ep1,
      submittedAt: new Date(now.getTime() - 86400000 * 2),
      submissionDate: day(new Date(now.getTime() - 86400000 * 2)),
      totalScore: 5,
      scoreInterpretation: "MILD",
      responses: minimalResponses(vasId, [5]),
      completedBy: "PATIENT",
      completionMethod: "MOBILE",
    },
    {
      id: randomUUID(),
      clinicId,
      patientId: pat2,
      promTypeId: ohsId,
      episodeId: ep2,
      submittedAt: new Date(now.getTime() - 86400000 * 10),
      submissionDate: day(new Date(now.getTime() - 86400000 * 10)),
      totalScore: 22,
      scoreInterpretation: "MODERATE",
      responses: minimalResponses(ohsId, Array(12).fill(3)),
      completedBy: "CLINICIAN",
      completionMethod: "IN_CLINIC",
    },
    {
      id: randomUUID(),
      clinicId,
      patientId: pat3,
      promTypeId: qdashId,
      episodeId: ep3,
      submittedAt: new Date(now.getTime() - 86400000 * 1),
      submissionDate: day(new Date(now.getTime() - 86400000 * 1)),
      totalScore: 50,
      scoreInterpretation: "MILD",
      responses: minimalResponses(qdashId, Array(11).fill(3)),
      completedBy: "PATIENT",
      completionMethod: "WEB",
    },
  ]);

  console.log("Seed complete: clinic, users, patients, episodes, PROM catalog, submissions.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
