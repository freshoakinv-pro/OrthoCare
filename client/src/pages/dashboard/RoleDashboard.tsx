import type { UserRole } from "@orthocare/shared";
import DoctorDashboard from "./DoctorDashboard";
import ClinicDashboard from "./ClinicDashboard";
import MsoDashboard from "./MsoDashboard";
import PatientDashboard from "./PatientDashboard";
import ClinicUserDashboard from "./ClinicUserDashboard";

export default function RoleDashboard({ role }: { role: UserRole }) {
  switch (role) {
    case "CLINIC_DOCTOR":
      return <DoctorDashboard />;
    case "CLINIC_ADMIN":
      return <ClinicDashboard />;
    case "CLINIC_USER":
      return <ClinicUserDashboard />;
    case "MSO_ADMIN":
      return <MsoDashboard />;
    case "PATIENT":
      return <PatientDashboard />;
    default:
      return <DoctorDashboard />;
  }
}
