import "./sidebar.css";
import { useNavigate ,NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar({ open, togglemenu }) {
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();

    function handleLogout() {
        setCurrentUser(null);
        navigate("/login", { replace: true });
    }
    return (
        <div>
            <button
                className={open ? "hamburger open" : "hamburger"}
                onClick={togglemenu}
            >
                ☰
            </button>

            <div className={open ? "sidebar open" : "sidebar"}>
                <h2>SkillHub</h2>

                <ul>
                    <li>
                        <NavLink
                            to="/admin/dashboard"
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            🏠 Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            👥 Users
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/courses"
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            🛡️ Courses
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/course-mapping"
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            🔗 Course Mapping
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/profile"
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            👤 My Profile
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/settings"
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            ⚙️ Settings
                        </NavLink>
                    </li>

                </ul>

            <button
                type="button"
                className="logout"
                onClick={handleLogout}
            >
                🚪 Logout
            </button>
            </div>
        </div>
    );
}

export default Sidebar;