import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import PlaceholderDashboard from "./pages/dashboard/PlaceholderDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/dashboard/:roleKey" element={<PlaceholderDashboard />} />
      <Route path="/admin/mso" element={<PlaceholderDashboard />} />
      <Route path="/portal" element={<PlaceholderDashboard />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
