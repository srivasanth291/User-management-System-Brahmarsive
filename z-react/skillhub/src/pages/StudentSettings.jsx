
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminPreferences.css";

const defaultNotifications = {
  email: true,
  courses: true,
};

function StudentSettings() {
  const { currentUser } = useAuth();
  const studentId = String(currentUser?.id ?? "");
  const storageKey = `skillhub_student_settings_${studentId}`;

  const [theme, setTheme] = useState(() =>
    localStorage.getItem("skillhub_theme") === "dark"
      ? "dark"
      : "light"
  );

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);

      return saved
        ? { ...defaultNotifications, ...JSON.parse(saved) }
        : defaultNotifications;
    } catch {
      return defaultNotifications;
    }
  });

  useEffect(() => {
    const selectedTheme =
      localStorage.getItem("skillhub_theme") === "dark"
        ? "dark"
        : "light";

    setTheme(selectedTheme);

    try {
      const saved = localStorage.getItem(storageKey);

      setNotifications(
        saved
          ? { ...defaultNotifications, ...JSON.parse(saved) }
          : defaultNotifications
      );
    } catch {
      setNotifications(defaultNotifications);
    }
  }, [storageKey]);

  useEffect(() => {
    document.documentElement.dataset.skillhubTheme = theme;
    localStorage.setItem("skillhub_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (studentId) {
      localStorage.setItem(
        storageKey,
        JSON.stringify(notifications)
      );
    }
  }, [notifications, storageKey, studentId]);

  function toggleNotification(name) {
    setNotifications((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  }

  return (
    <div className="admin-settings-page">
      <div className="admin-preferences-card">
        <h2>Appearance</h2>
        <p>Choose your preferred theme.</p>

        <div className="admin-setting-row">
          <div>
            <h3>Theme</h3>
            <p>Change the SkillHub student appearance.</p>
          </div>

          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            aria-label="Choose theme"
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
      </div>

      <div className="admin-preferences-card">
        <h2>Notifications</h2>
        <p>Manage your notification preferences.</p>

        <div className="admin-setting-row">
          <div>
            <h3>Email Notifications</h3>
            <p>Receive important updates by email.</p>
          </div>

          <label className="admin-switch">
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={() => toggleNotification("email")}
              aria-label="Email Notifications"
            />
            <span className="admin-switch-slider"></span>
          </label>
        </div>

        <div className="admin-setting-row">
          <div>
            <h3>Course Notifications</h3>
            <p>Receive course-related updates.</p>
          </div>

          <label className="admin-switch">
            <input
              type="checkbox"
              checked={notifications.courses}
              onChange={() => toggleNotification("courses")}
              aria-label="Course Notifications"
            />
            <span className="admin-switch-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default StudentSettings;
