import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth() {
  const { user, loading, recovering } = useAuth();
  if (loading) return <div className="auth-wrap" aria-busy="true"><div className="skeleton" style={{ width: 240, height: 24 }} /></div>;
  if (!user || recovering) return <Navigate to="/entrar" replace />;
  return <Outlet />;
}
