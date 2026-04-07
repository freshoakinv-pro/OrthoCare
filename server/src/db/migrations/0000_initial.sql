CREATE TABLE `appointments` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`doctor_id` varchar(36) NOT NULL,
	`appointment_type` enum('INITIAL_CONSULT','FOLLOW_UP','PROCEDURE','PHYSIO','DISCHARGE') NOT NULL,
	`status` enum('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL,
	`scheduled_at` datetime(3) NOT NULL,
	`notes` text,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinical_episodes` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`doctor_id` varchar(36) NOT NULL,
	`diagnosis_code` varchar(32) NOT NULL,
	`diagnosis_label` varchar(512) NOT NULL,
	`body_region` enum('KNEE','HIP','SHOULDER','SPINE','FOOT_ANKLE','HAND_WRIST','OTHER') NOT NULL,
	`laterality` enum('LEFT','RIGHT','BILATERAL') NOT NULL,
	`episode_status` enum('ACTIVE','RECOVERED','CHRONIC','SURGICAL','DISCHARGED') NOT NULL,
	`opened_at` datetime(3) NOT NULL,
	`closed_at` datetime(3),
	`notes` text,
	CONSTRAINT `clinical_episodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinical_notes` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`episode_id` varchar(36) NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`note_type` enum('SOAP','LETTER','IMAGING_REVIEW','PROCEDURE','DISCHARGE') NOT NULL,
	`content` text NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `clinical_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`registration_number` varchar(128) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `clinics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`notification_type` enum('PROM_REMINDER','APPOINTMENT_REMINDER','RESULT_ALERT') NOT NULL,
	`channel` enum('EMAIL','SMS','IN_APP') NOT NULL,
	`status` enum('PENDING','SENT','FAILED','OPENED') NOT NULL,
	`scheduled_at` datetime(3) NOT NULL,
	`sent_at` datetime(3),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`nric_hash` varchar(64) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`date_of_birth` date NOT NULL,
	`gender` varchar(32) NOT NULL,
	`primary_complaint` enum('KNEE','HIP','SHOULDER','SPINE','FOOT_ANKLE','HAND_WRIST','OTHER') NOT NULL,
	`assigned_doctor_id` varchar(36) NOT NULL,
	`referral_source` enum('GP_REFERRAL','SELF','INSURER','OTHER') NOT NULL,
	`insurer` enum('AIA','PRUDENTIAL','NTUC_INCOME','GREAT_EASTERN','OTHER','UNINSURED') NOT NULL,
	`archived_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prom_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prom_type_id` int NOT NULL,
	`question_order` int NOT NULL,
	`question_text` text NOT NULL,
	`response_options` json NOT NULL,
	`reverse_scored` boolean NOT NULL DEFAULT false,
	CONSTRAINT `prom_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prom_schedules` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`episode_id` varchar(36) NOT NULL,
	`prom_type_id` int NOT NULL,
	`frequency` enum('ONE_TIME','WEEKLY','FORTNIGHTLY','MONTHLY','QUARTERLY') NOT NULL,
	`next_due_at` datetime(3) NOT NULL,
	`last_sent_at` datetime(3),
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `prom_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prom_submissions` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`prom_type_id` int NOT NULL,
	`episode_id` varchar(36) NOT NULL,
	`submitted_at` datetime(3) NOT NULL,
	`submission_date` date NOT NULL,
	`total_score` int NOT NULL,
	`score_interpretation` enum('SEVERE','MODERATE','MILD','GOOD','EXCELLENT') NOT NULL,
	`responses` json NOT NULL,
	`completed_by` enum('PATIENT','CLINICIAN') NOT NULL,
	`completion_method` enum('WEB','MOBILE','IN_CLINIC') NOT NULL,
	CONSTRAINT `prom_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `prom_submissions_idempotency_uidx` UNIQUE(`patient_id`,`prom_type_id`,`submission_date`)
);
--> statement-breakpoint
CREATE TABLE `prom_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`applicable_regions` json NOT NULL,
	`question_count` int NOT NULL,
	`min_score` int NOT NULL,
	`max_score` int NOT NULL,
	`score_direction` enum('HIGHER_BETTER','LOWER_BETTER') NOT NULL,
	`description` text,
	CONSTRAINT `prom_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `prom_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`revoked_at` datetime(3),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_hash_uidx` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`clinic_id` varchar(36),
	`email` varchar(320) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('MSO_ADMIN','CLINIC_ADMIN','CLINIC_USER','CLINIC_DOCTOR','PATIENT') NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(32),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`last_login_at` datetime(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uidx` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinical_episodes` ADD CONSTRAINT `clinical_episodes_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinical_episodes` ADD CONSTRAINT `clinical_episodes_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinical_episodes` ADD CONSTRAINT `clinical_episodes_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD CONSTRAINT `clinical_notes_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD CONSTRAINT `clinical_notes_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD CONSTRAINT `clinical_notes_episode_id_clinical_episodes_id_fk` FOREIGN KEY (`episode_id`) REFERENCES `clinical_episodes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD CONSTRAINT `clinical_notes_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_assigned_doctor_id_users_id_fk` FOREIGN KEY (`assigned_doctor_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_questions` ADD CONSTRAINT `prom_questions_prom_type_id_prom_types_id_fk` FOREIGN KEY (`prom_type_id`) REFERENCES `prom_types`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_schedules` ADD CONSTRAINT `prom_schedules_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_schedules` ADD CONSTRAINT `prom_schedules_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_schedules` ADD CONSTRAINT `prom_schedules_episode_id_clinical_episodes_id_fk` FOREIGN KEY (`episode_id`) REFERENCES `clinical_episodes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_schedules` ADD CONSTRAINT `prom_schedules_prom_type_id_prom_types_id_fk` FOREIGN KEY (`prom_type_id`) REFERENCES `prom_types`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_submissions` ADD CONSTRAINT `prom_submissions_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_submissions` ADD CONSTRAINT `prom_submissions_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_submissions` ADD CONSTRAINT `prom_submissions_prom_type_id_prom_types_id_fk` FOREIGN KEY (`prom_type_id`) REFERENCES `prom_types`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prom_submissions` ADD CONSTRAINT `prom_submissions_episode_id_clinical_episodes_id_fk` FOREIGN KEY (`episode_id`) REFERENCES `clinical_episodes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `appointments_clinic_id_idx` ON `appointments` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `appointments_patient_id_idx` ON `appointments` (`patient_id`);--> statement-breakpoint
CREATE INDEX `appointments_doctor_id_idx` ON `appointments` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `appointments_scheduled_at_idx` ON `appointments` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `clinical_episodes_clinic_id_idx` ON `clinical_episodes` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `clinical_episodes_patient_id_idx` ON `clinical_episodes` (`patient_id`);--> statement-breakpoint
CREATE INDEX `clinical_episodes_doctor_id_idx` ON `clinical_episodes` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `clinical_notes_clinic_id_idx` ON `clinical_notes` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `clinical_notes_patient_id_idx` ON `clinical_notes` (`patient_id`);--> statement-breakpoint
CREATE INDEX `clinical_notes_episode_id_idx` ON `clinical_notes` (`episode_id`);--> statement-breakpoint
CREATE INDEX `clinical_notes_author_id_idx` ON `clinical_notes` (`author_id`);--> statement-breakpoint
CREATE INDEX `clinics_is_active_idx` ON `clinics` (`is_active`);--> statement-breakpoint
CREATE INDEX `notification_logs_clinic_id_idx` ON `notification_logs` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `notification_logs_patient_id_idx` ON `notification_logs` (`patient_id`);--> statement-breakpoint
CREATE INDEX `notification_logs_scheduled_at_idx` ON `notification_logs` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `patients_clinic_id_idx` ON `patients` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `patients_user_id_idx` ON `patients` (`user_id`);--> statement-breakpoint
CREATE INDEX `patients_assigned_doctor_id_idx` ON `patients` (`assigned_doctor_id`);--> statement-breakpoint
CREATE INDEX `prom_questions_prom_type_id_idx` ON `prom_questions` (`prom_type_id`);--> statement-breakpoint
CREATE INDEX `prom_schedules_clinic_id_idx` ON `prom_schedules` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `prom_schedules_patient_id_idx` ON `prom_schedules` (`patient_id`);--> statement-breakpoint
CREATE INDEX `prom_schedules_episode_id_idx` ON `prom_schedules` (`episode_id`);--> statement-breakpoint
CREATE INDEX `prom_schedules_prom_type_id_idx` ON `prom_schedules` (`prom_type_id`);--> statement-breakpoint
CREATE INDEX `prom_schedules_next_due_at_idx` ON `prom_schedules` (`next_due_at`);--> statement-breakpoint
CREATE INDEX `prom_submissions_clinic_id_idx` ON `prom_submissions` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `prom_submissions_patient_id_idx` ON `prom_submissions` (`patient_id`);--> statement-breakpoint
CREATE INDEX `prom_submissions_prom_type_id_idx` ON `prom_submissions` (`prom_type_id`);--> statement-breakpoint
CREATE INDEX `prom_submissions_episode_id_idx` ON `prom_submissions` (`episode_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_id_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_clinic_id_idx` ON `users` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);