
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import "./AdminPreferences.css";

function StaffProfile() {
  const { currentUser, setCurrentUser } = useAuth();
  const { users, updateUser } = useUsers();

  const staff = users.find(
    (user) =>
      String(user.id) === String(currentUser?.id) &&
      (user.role || "").toLowerCase() === "staff"
  );

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!staff || editing) return;

    setForm({
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
    });
  }, [staff, editing]);

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
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
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

    if (!staff || !currentUser) {
      setMessage("Staff account not found.");
      return;
    }

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
      (user) =>
        String(user.id) !== String(staff.id) &&
        (user.email || "").toLowerCase() === email
    );

    if (duplicate) {
      setMessage("This email is already registered.");
      return;
    }

    const details = {
      ...staff,
      name,
      email,
      phone,
    };

    updateUser(staff.id, details);

    setCurrentUser((previous) => ({
      ...previous,
      name,
      email,
      phone,
    }));

    setEditing(false);
    setMessage("Profile updated successfully.");
  }

  if (!staff) {
    return (
      <div className="admin-profile-page">
        <div className="admin-preferences-card">
          <p>Staff account not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-page">
      <div className="admin-preferences-card">
        <div className="admin-profile-top">
          <div className="admin-profile-avatar">
            {(staff.name || "S").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{staff.name}</h2>
            <p>Staff Member</p>
          </div>
        </div>

        <h3>Personal Information</h3>

        <form onSubmit={handleSave}>
          <div className="admin-pref-field">
            <label htmlFor="staffProfileName">Full Name</label>
            <input
              id="staffProfileName"
              name="name"
              value={editing ? form.name : staff.name || ""}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="staffProfileEmail">Email Address</label>
            <input
              id="staffProfileEmail"
              type="email"
              name="email"
              value={editing ? form.email : staff.email || ""}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="staffProfilePhone">Phone Number</label>
            <input
              id="staffProfilePhone"
              type="tel"
              name="phone"
              value={editing ? form.phone : staff.phone || ""}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={!editing}
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="staffProfileRole">Role</label>
            <input
              id="staffProfileRole"
              value="Staff"
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

export default StaffProfile;
