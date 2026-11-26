import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useUsers } from "../context/useUsers";
import "./AdminPreferences.css";

function AdminProfile() {
  const { currentUser, setCurrentUser } = useAuth();
  const { users, updateOwnProfile } = useUsers();

  const savedUser = users.find(
    (user) => String(user.id) === String(currentUser?.id)
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

  async function handleSave(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !email) {
      setMessage("Name and email are required.");
      return;
    }

    const duplicate = users.some(
      (item) =>
        item.email.toLowerCase() === email &&
        String(item.id) !== String(currentUser.id)
    );

    if (duplicate) {
      setMessage("This email is already registered.");
      return;
    }

    const details = { name, email, phone };

    try { await updateOwnProfile(currentUser.id, details); } catch (error) { setMessage(error.message); return; }

    setCurrentUser((previous) => ({
      ...previous,
      ...details,
    }));

    setEditing(false);
    setMessage("Profile updated successfully.");
  }

  return (
    <div className="admin-profile-page">
      <div className="admin-preferences-card">

        <div className="admin-profile-top">
          <div className="admin-profile-avatar">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{user?.name}</h2>
            <p>Administrator</p>
          </div>
        </div>

        <h3>Personal Information</h3>

        <form onSubmit={handleSave}>

          <div className="admin-pref-field">
            <label htmlFor="profileName">Full Name</label>
            <input
              id="profileName"
              name="name"
              value={editing ? form.name : user?.name || ""}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="profileEmail">Email Address</label>
            <input
              id="profileEmail"
              type="email"
              name="email"
              value={editing ? form.email : user?.email || ""}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="profilePhone">Phone Number</label>
            <input
              id="profilePhone"
              type="tel"
              name="phone"
              value={editing ? form.phone : user?.phone || ""}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={!editing}
            />
          </div>

          <div className="admin-pref-field">
            <label htmlFor="profileRole">Role</label>
            <input
              id="profileRole"
              value="Admin"
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

export default AdminProfile;
