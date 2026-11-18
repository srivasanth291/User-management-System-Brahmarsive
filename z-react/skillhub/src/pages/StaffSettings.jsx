
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminPreferences.css";

function getSavedSettings(staffId) {
  const defaults = {
    theme:
      localStorage.getItem("skillhub_theme") === "dark"
        ? "dark"
        : "light",
    courseNotifications: true,
    studentNotifications: true,
    emailNotifications: false,
  };

  try {
    const saved = localStorage.getItem(
      `skillhub_staff_settings_${staffId}`
    );

    return saved
      ? { ...defaults, ...JSON.parse(saved) }
      : defaults;
  } catch {
    return defaults;
  }
}

function StaffSettings() {
  const { currentUser } = useAuth();
  const staffId = String(currentUser?.id ?? "");

  const [settings, setSettings] = useState(() =>
    getSavedSettings(staffId)
  );

  useEffect(() => {
    localStorage.setItem(
      `skillhub_staff_settings_${staffId}`,
      JSON.stringify(settings)
    );

    localStorage.setItem("skillhub_theme", settings.theme);

    document.documentElement.dataset.skillhubTheme =
      settings.theme;
  }, [settings, staffId]);

  function handleThemeChange(theme) {
    setSettings((previous) => ({
      ...previous,
      theme,
    }));
  }

  function toggleNotification(name) {
    setSettings((previous) => ({
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
            <p>Change the SkillHub staff appearance.</p>
          </div>

          <select
            value={settings.theme}
            onChange={(event) =>
              handleThemeChange(event.target.value)
            }
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
              checked={settings.emailNotifications}
              onChange={() =>
                toggleNotification("emailNotifications")
              }
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
              checked={settings.courseNotifications}
              onChange={() =>
                toggleNotification("courseNotifications")
              }
              aria-label="Course Notifications"
            />
            <span className="admin-switch-slider"></span>
          </label>
        </div>

        <div className="admin-setting-row">
          <div>
            <h3>Student Activity</h3>
            <p>Receive notifications about student activity.</p>
          </div>

          <label className="admin-switch">
            <input
              type="checkbox"
              checked={settings.studentNotifications}
              onChange={() =>
                toggleNotification("studentNotifications")
              }
              aria-label="Student Activity"
            />
            <span className="admin-switch-slider"></span>
          </label>
        </div>
      </div>

      <p className="admin-settings-note">
        Preferences are saved automatically.
      </p>
    </div>
  );
}

export default StaffSettings;
