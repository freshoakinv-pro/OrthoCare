import {
  mysqlTable,
  varchar,
  text,
  boolean,
  datetime,
  mysqlEnum,
  int,
  json,
  index,
  uniqueIndex,
  date,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = mysqlEnum("role", [
  "MSO_ADMIN",
  "CLINIC_ADMIN",
  "CLINIC_USER",
  "CLINIC_DOCTOR",
  "PATIENT",
]);

const bodyRegionValues = [
  "KNEE",
  "HIP",
  "SHOULDER",
  "SPINE",
  "FOOT_ANKLE",
  "HAND_WRIST",
  "OTHER",
] as const;

export const primaryComplaintEnum = mysqlEnum("primary_complaint", bodyRegionValues);

export const bodyRegionEnum = mysqlEnum("body_region", bodyRegionValues);

export const referralSourceEnum = mysqlEnum("referral_source", [
  "GP_REFERRAL",
  "SELF",
  "INSURER",
  "OTHER",
]);

export const insurerEnum = mysqlEnum("insurer", [
  "AIA",
  "PRUDENTIAL",
  "NTUC_INCOME",
  "GREAT_EASTERN",
  "OTHER",
  "UNINSURED",
]);

export const appointmentTypeEnum = mysqlEnum("appointment_type", [
  "INITIAL_CONSULT",
  "FOLLOW_UP",
  "PROCEDURE",
  "PHYSIO",
  "DISCHARGE",
]);

export const appointmentStatusEnum = mysqlEnum("status", [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const lateralityEnum = mysqlEnum("laterality", [
  "LEFT",
  "RIGHT",
  "BILATERAL",
]);

export const episodeStatusEnum = mysqlEnum("episode_status", [
  "ACTIVE",
  "RECOVERED",
  "CHRONIC",
  "SURGICAL",
  "DISCHARGED",
]);

export const scoreDirectionEnum = mysqlEnum("score_direction", [
  "HIGHER_BETTER",
  "LOWER_BETTER",
]);

export const promFrequencyEnum = mysqlEnum("frequency", [
  "ONE_TIME",
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "QUARTERLY",
]);

export const scoreInterpretationEnum = mysqlEnum("score_interpretation", [
  "SEVERE",
  "MODERATE",
  "MILD",
  "GOOD",
  "EXCELLENT",
]);

export const completedByEnum = mysqlEnum("completed_by", [
  "PATIENT",
  "CLINICIAN",
]);

export const completionMethodEnum = mysqlEnum("completion_method", [
  "WEB",
  "MOBILE",
  "IN_CLINIC",
]);

export const noteTypeEnum = mysqlEnum("note_type", [
  "SOAP",
  "LETTER",
  "IMAGING_REVIEW",
  "PROCEDURE",
  "DISCHARGE",
]);

export const notificationTypeEnum = mysqlEnum("notification_type", [
  "PROM_REMINDER",
  "APPOINTMENT_REMINDER",
  "RESULT_ALERT",
]);

export const notificationChannelEnum = mysqlEnum("channel", [
  "EMAIL",
  "SMS",
  "IN_APP",
]);

export const notificationStatusEnum = mysqlEnum("status", [
  "PENDING",
  "SENT",
  "FAILED",
  "OPENED",
]);

export const clinics = mysqlTable(
  "clinics",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address").notNull(),
    registrationNumber: varchar("registration_number", { length: 128 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("clinics_is_active_idx").on(t.isActive)],
);

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 }).references(() => clinics.id, {
      onDelete: "restrict",
    }),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum.notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    lastLoginAt: datetime("last_login_at", { mode: "date", fsp: 3 }),
  },
  (t) => [
    uniqueIndex("users_email_uidx").on(t.email),
    index("users_clinic_id_idx").on(t.clinicId),
    index("users_role_idx").on(t.role),
  ],
);

export const patients = mysqlTable(
  "patients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    userId: varchar("user_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    nricHash: varchar("nric_hash", { length: 64 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
    gender: varchar("gender", { length: 32 }).notNull(),
    primaryComplaint: primaryComplaintEnum.notNull(),
    assignedDoctorId: varchar("assigned_doctor_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    referralSource: referralSourceEnum.notNull(),
    insurer: insurerEnum.notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("patients_clinic_id_idx").on(t.clinicId),
    index("patients_user_id_idx").on(t.userId),
    index("patients_assigned_doctor_id_idx").on(t.assignedDoctorId),
  ],
);

export const appointments = mysqlTable(
  "appointments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    doctorId: varchar("doctor_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    appointmentType: appointmentTypeEnum.notNull(),
    status: appointmentStatusEnum.notNull(),
    scheduledAt: datetime("scheduled_at", { mode: "date", fsp: 3 }).notNull(),
    notes: text("notes"),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("appointments_clinic_id_idx").on(t.clinicId),
    index("appointments_patient_id_idx").on(t.patientId),
    index("appointments_doctor_id_idx").on(t.doctorId),
    index("appointments_scheduled_at_idx").on(t.scheduledAt),
  ],
);

export const clinicalEpisodes = mysqlTable(
  "clinical_episodes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    doctorId: varchar("doctor_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    diagnosisCode: varchar("diagnosis_code", { length: 32 }).notNull(),
    diagnosisLabel: varchar("diagnosis_label", { length: 512 }).notNull(),
    bodyRegion: bodyRegionEnum.notNull(),
    laterality: lateralityEnum.notNull(),
    episodeStatus: episodeStatusEnum.notNull(),
    openedAt: datetime("opened_at", { mode: "date", fsp: 3 }).notNull(),
    closedAt: datetime("closed_at", { mode: "date", fsp: 3 }),
    notes: text("notes"),
  },
  (t) => [
    index("clinical_episodes_clinic_id_idx").on(t.clinicId),
    index("clinical_episodes_patient_id_idx").on(t.patientId),
    index("clinical_episodes_doctor_id_idx").on(t.doctorId),
  ],
);

export const promTypes = mysqlTable("prom_types", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  applicableRegions: json("applicable_regions").$type<string[]>().notNull(),
  questionCount: int("question_count").notNull(),
  minScore: int("min_score").notNull(),
  maxScore: int("max_score").notNull(),
  scoreDirection: scoreDirectionEnum.notNull(),
  description: text("description"),
});

export const promQuestions = mysqlTable(
  "prom_questions",
  {
    id: int("id").primaryKey().autoincrement(),
    promTypeId: int("prom_type_id")
      .notNull()
      .references(() => promTypes.id, { onDelete: "cascade" }),
    questionOrder: int("question_order").notNull(),
    questionText: text("question_text").notNull(),
    responseOptions: json("response_options")
      .$type<{ value: string; label: string; score: number }[]>()
      .notNull(),
    reverseScored: boolean("reverse_scored").notNull().default(false),
  },
  (t) => [index("prom_questions_prom_type_id_idx").on(t.promTypeId)],
);

export const promSchedules = mysqlTable(
  "prom_schedules",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    episodeId: varchar("episode_id", { length: 36 })
      .notNull()
      .references(() => clinicalEpisodes.id, { onDelete: "restrict" }),
    promTypeId: int("prom_type_id")
      .notNull()
      .references(() => promTypes.id, { onDelete: "restrict" }),
    frequency: promFrequencyEnum.notNull(),
    nextDueAt: datetime("next_due_at", { mode: "date", fsp: 3 }).notNull(),
    lastSentAt: datetime("last_sent_at", { mode: "date", fsp: 3 }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    index("prom_schedules_clinic_id_idx").on(t.clinicId),
    index("prom_schedules_patient_id_idx").on(t.patientId),
    index("prom_schedules_episode_id_idx").on(t.episodeId),
    index("prom_schedules_prom_type_id_idx").on(t.promTypeId),
    index("prom_schedules_next_due_at_idx").on(t.nextDueAt),
  ],
);

export const promSubmissions = mysqlTable(
  "prom_submissions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    promTypeId: int("prom_type_id")
      .notNull()
      .references(() => promTypes.id, { onDelete: "restrict" }),
    episodeId: varchar("episode_id", { length: 36 })
      .notNull()
      .references(() => clinicalEpisodes.id, { onDelete: "restrict" }),
    submittedAt: datetime("submitted_at", { mode: "date", fsp: 3 }).notNull(),
    submissionDate: date("submission_date", { mode: "string" }).notNull(),
    totalScore: int("total_score").notNull(),
    scoreInterpretation: scoreInterpretationEnum.notNull(),
    responses: json("responses")
      .$type<
        { questionId: number; responseValue: string; score: number }[]
      >()
      .notNull(),
    completedBy: completedByEnum.notNull(),
    completionMethod: completionMethodEnum.notNull(),
  },
  (t) => [
    index("prom_submissions_clinic_id_idx").on(t.clinicId),
    index("prom_submissions_patient_id_idx").on(t.patientId),
    index("prom_submissions_prom_type_id_idx").on(t.promTypeId),
    index("prom_submissions_episode_id_idx").on(t.episodeId),
    uniqueIndex("prom_submissions_idempotency_uidx").on(
      t.patientId,
      t.promTypeId,
      t.submissionDate,
    ),
  ],
);

export const clinicalNotes = mysqlTable(
  "clinical_notes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    episodeId: varchar("episode_id", { length: 36 })
      .notNull()
      .references(() => clinicalEpisodes.id, { onDelete: "restrict" }),
    authorId: varchar("author_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    noteType: noteTypeEnum.notNull(),
    content: text("content").notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("clinical_notes_clinic_id_idx").on(t.clinicId),
    index("clinical_notes_patient_id_idx").on(t.patientId),
    index("clinical_notes_episode_id_idx").on(t.episodeId),
    index("clinical_notes_author_id_idx").on(t.authorId),
  ],
);

export const notificationLogs = mysqlTable(
  "notification_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    notificationType: notificationTypeEnum.notNull(),
    channel: notificationChannelEnum.notNull(),
    status: notificationStatusEnum.notNull(),
    scheduledAt: datetime("scheduled_at", { mode: "date", fsp: 3 }).notNull(),
    sentAt: datetime("sent_at", { mode: "date", fsp: 3 }),
  },
  (t) => [
    index("notification_logs_clinic_id_idx").on(t.clinicId),
    index("notification_logs_patient_id_idx").on(t.patientId),
    index("notification_logs_scheduled_at_idx").on(t.scheduledAt),
  ],
);

export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    revokedAt: datetime("revoked_at", { mode: "date", fsp: 3 }),
  },
  (t) => [
    index("refresh_tokens_user_id_idx").on(t.userId),
    uniqueIndex("refresh_tokens_token_hash_uidx").on(t.tokenHash),
  ],
);

export const promLinkTokens = mysqlTable(
  "prom_link_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jti: varchar("jti", { length: 64 }).notNull(),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    promTypeId: int("prom_type_id")
      .notNull()
      .references(() => promTypes.id, { onDelete: "cascade" }),
    episodeId: varchar("episode_id", { length: 36 })
      .notNull()
      .references(() => clinicalEpisodes.id, { onDelete: "cascade" }),
    clinicId: varchar("clinic_id", { length: 36 })
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    usedAt: datetime("used_at", { mode: "date", fsp: 3 }),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("prom_link_tokens_jti_uidx").on(t.jti),
    index("prom_link_tokens_patient_id_idx").on(t.patientId),
    index("prom_link_tokens_clinic_id_idx").on(t.clinicId),
  ],
);
