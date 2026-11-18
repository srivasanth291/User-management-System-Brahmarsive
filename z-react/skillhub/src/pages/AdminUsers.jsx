import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import "./AdminUsers.css";

const initialForm = {
  name: "",
  email: "",
  role: "student",
  permissions: [],
};

const permissionsList = [
  "Create Course",
  "Add Student",
  "Manage Users",
  "View Reports",
];

function AdminUsers() {
  const {
    users,
    inviteUser,
    resendInvite,
    updateUser,
    deactivateUser,
    activateUser,
    revokeInvite,
    deleteUser,
  } = useUsers();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("Active");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setForm({ ...initialForm, permissions: [] });
      setEditingId(null);
      setModal("invite");

      const next = new URLSearchParams(searchParams);
      next.delete("add");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const shouldSearch = keyword.length >= 3;

    return users.filter((user) => {
      const role = (user.role || "").toLowerCase();
      const status = user.status || "Active";


      if (role !== "staff" && role !== "student") {
        return false;
      }

      const matchesTab = status.toLowerCase() === activeTab.toLowerCase();

      const matchesRole = roleFilter === "All" || role === roleFilter;

      const matchesSearch =
        !shouldSearch ||
        (user.name || "").toLowerCase().includes(keyword) ||
        (user.email || "").toLowerCase().includes(keyword);

      return matchesTab && matchesRole && matchesSearch;
    });
  }, [users, activeTab, roleFilter, search]);
  function openInviteModal() {
    setForm({ ...initialForm, permissions: [] });
    setEditingId(null);
    setModal("invite");
  }

  function openEditModal(user) {
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role.toLowerCase(),
      permissions: [...(user.permissions || [])],
    });

    setEditingId(user.id);
    setModal("edit");
  }

  function closeModal() {
    setModal("");
    setEditingId(null);
    setForm({ ...initialForm, permissions: [] });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function togglePermission(permission) {
    setForm((previous) => ({
      ...previous,
      permissions: previous.permissions.includes(permission)
        ? previous.permissions.filter((p) => p !== permission)
        : [...previous.permissions, permission],
    }));
  }

  function openGmailInvite(user) {
    const inviteLink = `${window.location.origin}/set-password?token=${user.inviteToken}`;

    const subject = "SkillHub - Account Invitation";

    const body =
      `Hi ${user.name},\n\n` +
      `You have been invited to join SkillHub.\n\n` +
      `Please open this link to set your password:\n` +
      `${inviteLink}\n\n` +
      `After setting your password, you can log in.\n\n` +
      `SkillHub Team`;

    const gmailUrl =
      "https://mail.google.com/mail/?view=cm&fs=1" +
      `&to=${encodeURIComponent(user.email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  }

  function handleInvite(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email) {
      alert("Name and Email are required.");
      return;
    }

    const result = inviteUser({
      name,
      email,
      role: form.role,
      permissions: form.permissions,
    });

    if (!result.ok) {
      alert(result.message);
      return;
    }

    closeModal();
    setActiveTab("Pending");

    // Opens Gmail compose. Admin must click Send manually.
    openGmailInvite(result.user);
  }

  function handleResend(user) {
    const updated = resendInvite(user.id);

    if (updated) {
      openGmailInvite(updated);
    }
  }

  function handleEdit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email) {
      alert("Name and Email are required.");
      return;
    }

    const duplicate = users.some(
      (user) =>
        user.email.toLowerCase() === email &&
        String(user.id) !== String(editingId),
    );

    if (duplicate) {
      alert("Email already exists.");
      return;
    }

    updateUser(editingId, {
      name,
      email,
      role: form.role,
      permissions: form.permissions,
    });

    closeModal();
  }

  function handleDeactivate(user) {
    if (window.confirm(`Deactivate ${user.name}?`)) {
      deactivateUser(user.id);
    }
  }

  function handleActivate(user) {
    if (window.confirm(`Activate ${user.name}?`)) {
      activateUser(user.id);
    }
  }

  function handleRevoke(user) {
    if (window.confirm(`Cancel invitation for ${user.email}?`)) {
      revokeInvite(user.id);
    }
  }

  function handleDelete(user) {
    if (window.confirm(`Permanently delete ${user.name}?`)) {
      deleteUser(user.id);
    }
  }

  return (
    <div className="admin-users">
      <div className="users-top-row">
        <div className="users-status-tabs">
          {[
            ["Active", "Active Users"],
            ["Pending", "Pending Invites"],
            ["Deactivated", "Deactivated Users"],
          ].map(([status, label]) => (
            <button
              key={status}
              type="button"
              className={activeTab === status ? "selected" : ""}
              onClick={() => setActiveTab(status)}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="users-invite-btn"
          onClick={openInviteModal}
        >
          + Invite User
        </button>
      </div>

      <section className="users-list-panel">
        <h2>
          {activeTab === "Active"
            ? "Active User List"
            : activeTab === "Pending"
              ? "Pending Invite List"
              : "Deactivated User List"}
        </h2>

        <div className="users-list-controls">
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="users-table-scroll">
          <table className="users-screenshot-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email ID</th>
                <th>Last Login</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.lastLogin || "—"}</td>
                  <td>{user.role}</td>

                  <td>
                    <div className="users-table-actions">
                      {activeTab === "Active" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(user)}
                          >
                            Deactivate
                          </button>
                        </>
                      )}

                      {activeTab === "Pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResend(user)}
                          >
                            Resend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(user)}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {activeTab === "Deactivated" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActivate(user)}
                          >
                            Activate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="users-no-results">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div
          className="users-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="users-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-title"
          >
            <div className="users-form-heading">
              <h2 id="user-form-title">
                {modal === "invite" ? "Invite User" : "Edit User"}
              </h2>

              <button type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={modal === "invite" ? handleInvite : handleEdit}>
              <label>
                Full Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Email Address *
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Role *
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
              </label>

              {form.role === "staff" && (
                <fieldset className="users-staff-permissions">
                  <legend>Staff Permissions</legend>

                  {permissionsList.map((permission) => (
                    <label key={permission}>
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                      />
                      {permission}
                    </label>
                  ))}
                </fieldset>
              )}

              {modal === "invite" && (
                <p className="users-invite-note">
                  Gmail compose will open with an invitation link. You must
                  click Send in Gmail.
                </p>
              )}

              <div className="users-form-buttons">
                <button
                  type="button"
                  className="users-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="users-save">
                  {modal === "invite" ? "Open Gmail Invite" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
