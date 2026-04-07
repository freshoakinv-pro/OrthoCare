import type { UserRole } from "@orthocare/shared";

/** Default app path after login for each role (under /dashboard or patient home). */
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "MSO_ADMIN":
      return "/admin";
    case "CLINIC_ADMIN":
      return "/dashboard";
    case "CLINIC_USER":
      return "/dashboard";
    case "CLINIC_DOCTOR":
      return "/dashboard";
    case "PATIENT":
      return "/my-journey";
    default:
      return "/dashboard";
  }
}
