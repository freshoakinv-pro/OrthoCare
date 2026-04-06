import { Navigate, Route, Routes } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { readAuthHintFromStorage } from "@/hooks/useAuth";
import { dashboardPathForRole } from "@/lib/dashboardPath";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RequireRole } from "@/components/auth/RequireRole";
import { AppShell } from "@/components/layout/AppShell";
import LoginPage from "@/pages/auth/Login";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import MsoDashboard from "@/pages/dashboard/MsoDashboard";
import { PlaceholderPage } from "@/pages/_Placeholder";
import PatientList from "@/pages/patients/PatientList";
import PatientDetail from "@/pages/patients/PatientDetail";
import RegisterPatient from "@/pages/patients/RegisterPatient";
import PromQuestionnaire from "@/pages/proms/PromQuestionnaire";
import LegacyQuestionnaireRedirect from "@/pages/proms/LegacyQuestionnaireRedirect";
import PromSchedules from "@/pages/proms/PromSchedules";
import PromResults from "@/pages/proms/PromResults";
import AppointmentCalendar from "@/pages/appointments/AppointmentCalendar";
import MyJourney from "@/pages/patient/MyJourney";
import MyScores from "@/pages/patient/MyScores";
import PendingProms from "@/pages/patient/PendingProms";
import MyAppointments from "@/pages/patient/MyAppointments";
import type { UserRole } from "@orthocare/shared";

function RootRedirect() {
  const me = trpc.auth.me.useQuery(undefined, { retry: false });

  if (me.isLoading && readAuthHintFromStorage()) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--mist)", fontFamily: "var(--font-ui)" }}>
        Loading…
      </div>
    );
  }

  if (me.data) {
    return <Navigate to={dashboardPathForRole(me.data.role as UserRole)} replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AuthGuard />}>
        <Route path="/proms/questionnaire/:scheduleId" element={<LegacyQuestionnaireRedirect />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/admin"
            element={
              <RequireRole roles={["MSO_ADMIN"]}>
                <MsoDashboard />
              </RequireRole>
            }
          />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/new" element={<RegisterPatient />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/appointments" element={<AppointmentCalendar />} />
          <Route path="/proms" element={<PromSchedules />} />
          <Route path="/proms/complete/:scheduleId" element={<PromQuestionnaire />} />
          <Route path="/proms/results" element={<PromResults />} />
          <Route path="/my-journey" element={<MyJourney />} />
          <Route path="/my-scores" element={<MyScores />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/my-pending-proms" element={<PendingProms />} />
          <Route path="/notes" element={<PlaceholderPage title="Notes" />} />
          <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
          <Route path="/clinics" element={<PlaceholderPage title="Clinics" />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="/schedule" element={<PlaceholderPage title="Schedule" />} />
        </Route>
      </Route>

      <Route path="/auth/login" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard/doctor" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/clinic" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/clinic-user" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/mso" element={<Navigate to="/admin" replace />} />
      <Route path="/patient/journey" element={<Navigate to="/dashboard" replace />} />
      <Route path="/patient/my-journey" element={<Navigate to="/my-journey" replace />} />
      <Route path="/patient/scores" element={<Navigate to="/my-scores" replace />} />
      <Route path="/patient/appointments" element={<Navigate to="/my-appointments" replace />} />
      <Route path="/patient/pending-proms" element={<Navigate to="/my-pending-proms" replace />} />
      <Route path="/patients/register" element={<Navigate to="/patients/new" replace />} />
      <Route path="/proms/schedules" element={<Navigate to="/proms" replace />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
