import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import LoginPage from "@/pages/auth/Login";
import DoctorDashboard from "@/pages/dashboard/DoctorDashboard";
import ClinicDashboard from "@/pages/dashboard/ClinicDashboard";
import MsoDashboard from "@/pages/dashboard/MsoDashboard";
import PatientDashboard from "@/pages/dashboard/PatientDashboard";
import ClinicUserDashboard from "@/pages/dashboard/ClinicUserDashboard";
import { PlaceholderPage } from "@/pages/_Placeholder";
import PatientList from "@/pages/patients/PatientList";
import PatientDetail from "@/pages/patients/PatientDetail";
import RegisterPatient from "@/pages/patients/RegisterPatient";
import PromQuestionnaire from "@/pages/proms/PromQuestionnaire";
import PromSchedules from "@/pages/proms/PromSchedules";
import PromResults from "@/pages/proms/PromResults";

export default function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/clinic" element={<ClinicDashboard />} />
        <Route path="/dashboard/clinic-user" element={<ClinicUserDashboard />} />
        <Route path="/dashboard/mso" element={<MsoDashboard />} />
        <Route path="/patient/journey" element={<PatientDashboard />} />
        <Route path="/patient/scores" element={<PlaceholderPage title="My Scores" />} />
        <Route path="/patient/appointments" element={<PlaceholderPage title="My appointments" />} />
        <Route path="/patient/pending-proms" element={<PlaceholderPage title="Pending PROMs" />} />
        <Route path="/proms/questionnaire/:scheduleId" element={<PromQuestionnaire />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/register" element={<RegisterPatient />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/appointments" element={<PlaceholderPage title="Appointments" />} />
        <Route path="/proms/schedules" element={<PromSchedules />} />
        <Route path="/proms/results" element={<PromResults />} />
        <Route path="/notes" element={<PlaceholderPage title="Notes" />} />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="/clinics" element={<PlaceholderPage title="Clinics" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="/schedule" element={<PlaceholderPage title="Schedule" />} />
      </Route>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
