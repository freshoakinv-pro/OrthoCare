export const USER_ROLES = [
  "MSO_ADMIN",
  "CLINIC_ADMIN",
  "CLINIC_USER",
  "CLINIC_DOCTOR",
  "PATIENT",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const BODY_REGIONS = [
  "KNEE",
  "HIP",
  "SHOULDER",
  "SPINE",
  "FOOT_ANKLE",
  "HAND_WRIST",
  "OTHER",
] as const;

export type BodyRegion = (typeof BODY_REGIONS)[number];
