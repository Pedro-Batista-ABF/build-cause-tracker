
import { useAuth } from "@/lib/auth";
import { Navigate, Outlet } from "react-router-dom";

export function AuthGuard() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
