import { LoaderCircle } from "lucide-react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
function ProtectedRoute({
  children,
  allowedRoles
}) {
  const {
    user,
    loading,
    isAuthenticated
  } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle size={38} className="animate-spin text-emerald-600" />
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{
      from: location.pathname
    }} />;
  }
  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
export default ProtectedRoute;
