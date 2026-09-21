import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { authEnabled } from "../api/sources";
import { useAuth } from "./useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (!authEnabled) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-400 dark:text-slate-500">
        Loading&hellip;
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
