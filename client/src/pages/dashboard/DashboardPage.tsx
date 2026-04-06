import { useAuth } from "@/hooks/useAuth";
import RoleDashboard from "./RoleDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <RoleDashboard role={user.role} />;
}
