
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/lib/auth";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthForm />
    </div>
  );
}
