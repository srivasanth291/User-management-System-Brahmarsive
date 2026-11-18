
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";

function StaffCourseGuard({ children }) {
  const { currentUser } = useAuth();
  const { users } = useUsers();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const staff = users.find(
    (user) => String(user.id) === String(currentUser.id)
  );

  const isActiveStaff =
    String(staff?.role || "").toLowerCase() === "staff" &&
    String(staff?.status || "").toLowerCase() === "active";

  const permissions = staff?.permissions || [];

  const canCreate =
    isActiveStaff &&
    (Array.isArray(permissions)
      ? permissions.includes("Create Course")
      : permissions.createCourse === true);

  if (!canCreate) {
    return <Navigate to="/staff/courses" replace />;
  }

  return children;
}

export default StaffCourseGuard;
