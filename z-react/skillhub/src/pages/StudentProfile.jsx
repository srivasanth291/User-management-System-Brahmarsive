
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import "./AdminPreferences.css";

function StudentProfile() {
  const { currentUser, setCurrentUser } = useAuth();
  const { users, updateUser } = useUsers();

  const savedUser = users.find(
    (user) =>
      String(user.id) === String(currentUser?.id) &&
      (user.role || "").toLowerCase() === "student"
  );

  const user = savedUser || currentUser;

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  function handleEdit() {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });

    setEditing(true);
    setMessage("");
  }

  function handleCancel() {
    setEditing(false);
    setMessage("");
  }

  function handleSave(event) {
    event.preventDefault();

    if (!user || !currentUser) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !email) {
      setMessage("Name and email are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email.");
      return;
    }

    if (phone && !/^[0-9+\s()-]{7,20}$/.test(phone)) {
      setMessage("Please enter a valid phone number.");
      return;
    }

    const duplicate = users.some(
      (item) =>
        String(item.id) !== String(currentUser.id) &&
        (item.email || "").toLowerCase() === email
    );

    if (duplicate) {
      setMessage("This email is already registered.");
      return;
    }

    const details = {
      ...user,
      name,
      email,
      phone,
    };

    updateUser(currentUser.id, details);

    setCurrentUser((previous) => ({
      ...previous,
      name,
      email,
      phone,
    }));

    setEditing(false);
    setMessage("Profile updated successfully.");
  }

  return (
    <div className="admin-profile-page">
      <div className="admin-preferences-card">
        <div className="admin-profile-top">
          <div className="admin-profile-avatar">
            {(user?.name || "S").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{user?.name || "Student"}</h2>
            <p>Student</p>
          </div>
        </div>

        <h3>Personal Information</h3>

        <form onSubmit={handleSave}>
          <div className="admin-pref-field">
            <label htmlFor="studentProfileName">Full Name</label>
            <input
              id="studentProfileName"
              name="name"
              value={editing ? form.name : user?.name || ""}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="studentProfileEmail">Email Address</label>
            <input
              id="studentProfileEmail"
              type="email"
              name="email"
              value={editing ? form.email : user?.email || ""}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="studentProfilePhone">Phone Number</label>
            <input
              id="studentProfilePhone"
              type="tel"
              name="phone"
              value={editing ? form.phone : user?.phone || ""}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={!editing}
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="studentProfileRole">Role</label>
            <input
              id="studentProfileRole"
              value="Student"
              disabled
              readOnly
            />
          </div>

          {message && (
            <p className="admin-pref-message" role="status">
              {message}
            </p>
          )}

          <div className="admin-pref-actions">
            {!editing ? (
              <button type="button" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="admin-pref-cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit">
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentProfile;
