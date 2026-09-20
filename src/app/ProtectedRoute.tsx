import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import { useAuth } from "../state/AuthProvider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen label="Checking your session" />;
  // The attempted destination travels with the redirect so sign-in returns there.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
