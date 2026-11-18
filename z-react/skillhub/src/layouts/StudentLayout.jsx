
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./StudentLayout.css";

function StudentLayout() {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/student/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/student/courses", icon: "📚", label: "My Courses" },
    { path: "/student/profile", icon: "👤", label: "My Profile" },
    { path: "/student/settings", icon: "⚙️", label: "Settings" },
  ];

  const pageTitles = {
    "/student/dashboard": "Dashboard",
    "/student/courses": "My Courses",
    "/student/profile": "My Profile",
    "/student/settings": "Settings",
  };

  const pageTitle = location.pathname.startsWith("/student/courses/")
    ? "Course Player"
    : pageTitles[location.pathname] || "SkillHub";

  function handleLogout() {
    setCurrentUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <div className="student-layout">
      <aside
        className={
          sidebarOpen
            ? "student-sidebar"
            : "student-sidebar collapsed"
        }
      >
        <h2>SkillHub</h2>

        <nav>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/student/courses" ? false : true}
              className={({ isActive }) =>
                isActive
                  ? "student-nav-link active"
                  : "student-nav-link"
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="student-logout"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </aside>

      <div
        className={
          sidebarOpen
            ? "student-main"
            : "student-main expanded"
        }
      >
        <header className="student-header">
          <div className="student-header-left">
            <button
              type="button"
              className="student-menu-toggle"
              onClick={() => setSidebarOpen((previous) => !previous)}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>

            <h1>{pageTitle}</h1>
          </div>

          <div className="student-header-right">
            <span className="student-header-name">
              {currentUser?.name || "Student"}
            </span>

            <button
              type="button"
              className="student-profile-btn"
              onClick={() => navigate("/student/profile")}
            >
              My Profile
            </button>
          </div>
        </header>

        <main className="student-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
