import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header({ title, actions = [] }) {
  const navigate = useNavigate();

  return (
    <header className="top-header">
      <h1>{title}</h1>

      <div className="header-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            className={action.className || "header-btn"}
            onClick={() => navigate(action.path)}
          >
            {action.label}
          </button>
        ))}

        <button className="notification-btn" title="Notifications">
          🔔
        </button>

        <button
          className="profile-btn"
          onClick={() => navigate("/admin/profile")}
        >
          My Profile
        </button>
      </div>
    </header>
  );
}

export default Header;