import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRole, children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
 
  const userRole = String(currentUser.role || "").toLowerCase();
  const requiredRole = String(allowedRole || "").toLowerCase();
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }

  return children;
}

export default ProtectedRoute;
