import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function StaffCourseGuard({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (
    String(currentUser.role).toLowerCase() !== "staff"
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default StaffCourseGuard;