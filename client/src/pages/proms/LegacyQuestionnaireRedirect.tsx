import { Navigate, useParams } from "react-router-dom";

export default function LegacyQuestionnaireRedirect() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  return <Navigate to={`/proms/complete/${scheduleId}`} replace />;
}
