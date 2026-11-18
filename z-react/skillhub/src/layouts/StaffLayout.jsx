
import { useState } from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./StaffLayout.css";
import "./StaffHeader.css";

function StaffLayout() {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/staff/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/staff/courses", icon: "📚", label: "My Courses" },
    { path: "/staff/students", icon: "👥", label: "My Students" },
    {
      path: "/staff/course-mapping",
      icon: "🔗",
      label: "Course Mapping",
    },
    { path: "/staff/profile", icon: "👤", label: "My Profile" },
    { path: "/staff/settings", icon: "⚙️", label: "Settings" },
  ];

  const pageTitles = {
    "/staff/dashboard": "Dashboard",
    "/staff/courses": "My Courses",
    "/staff/courses/create": "Create Course",
    "/staff/students": "My Students",
    "/staff/course-mapping": "Course Mapping",
    "/staff/profile": "My Profile",
    "/staff/settings": "Settings",
  };

  const currentTitle =
    pageTitles[location.pathname] || "SkillHub";

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if ((currentUser.role || "").toLowerCase() !== "staff") {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    setCurrentUser(null);
    navigate("/login", { replace: true });
  }

  function toggleSidebar() {
    setSidebarOpen((previous) => !previous);
  }

  return (
    <div className="staff-layout">
      <aside
        className={
          sidebarOpen
            ? "staff-sidebar"
            : "staff-sidebar collapsed"
        }
      >
        <h2>SkillHub</h2>

        <nav>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "staff-nav-link active"
                  : "staff-nav-link"
              }
            >
              <span className="staff-nav-icon">
                {item.icon}
              </span>

              <span className="staff-nav-label">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="staff-logout"
          onClick={handleLogout}
        >
          <span>🚪</span>
          <span className="staff-nav-label">Logout</span>
        </button>
      </aside>

      <div
        className={
          sidebarOpen
            ? "staff-main"
            : "staff-main expanded"
        }
      >
        <header className="staff-header">
          <div className="staff-header-left">
            <button
              type="button"
              className="staff-menu-toggle"
              onClick={toggleSidebar}
              aria-label={
                sidebarOpen ? "Close sidebar" : "Open sidebar"
              }
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>

            <h1 className="staff-header-title">
              {currentTitle}
            </h1>
          </div>

          <div className="staff-header-user">
            <span className="staff-header-name">
              {currentUser.name || "Staff"}
            </span>

            <span className="staff-role-label">
              Staff
            </span>
          </div>
        </header>

        <main className="staff-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StaffLayout;
