import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, postJson } from "../api/client";
const UserContext = createContext(null);
export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const refreshUsers = useCallback(async () => {
    if (!sessionStorage.getItem("skillhub_access_token")) return;
    const [u, i] = await Promise.all([api("/api/users?limit=100"), api("/api/invitations")]);
    setInvitations(i.invitations || []);
    setUsers([...(u.users || []).map(user => ({ ...user, status: user.isActive ? "Active" : "Deactivated" })), ...(i.invitations || []).filter(inv => inv.status === "pending").map(inv => ({ ...inv, id: `invite-${inv.id}`, name: inv.email.split("@")[0], status: "Pending", inviteId: inv.id }))]);
  }, []);
  useEffect(() => {
    const listener = () => refreshUsers().catch(console.error);
    window.addEventListener("skillhub-auth-change", listener);
    listener();
    return () => window.removeEventListener("skillhub-auth-change", listener);
  }, [refreshUsers]);
  async function inviteUser(details) {
    try {
      await api("/api/invitations/send", postJson({ email: details.email, role: details.role }));
      await refreshUsers();
      return { ok: true, message: "Invitation email sent" };
    } catch (error) { return { ok: false, message: error.message }; }
  }
  async function resendInvite(id) {
    const inv = invitations.find(i => `invite-${i.id}` === String(id));
    if (!inv) return null;
    const result = await inviteUser({ email: inv.email, role: inv.role });
    return result.ok ? result : null;
  }
  async function revokeInvite(id) {
    const invId = String(id).replace(/^invite-/, "");
    await api(`/api/invitations/${invId}/revoke`, { method: "POST" });
    await refreshUsers();
  }
  async function updateUser(id, details) {
    const { name, email, isActive } = details;
    await api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ name, email, ...(isActive === undefined ? {} : { isActive }) }) });
    await refreshUsers();
  }
  async function deactivateUser(id) { return updateUser(id, { isActive: false }); }
  async function activateUser(id) { return updateUser(id, { isActive: true }); }
  async function deleteUser(id) { await api(`/api/users/${id}`, { method: "DELETE" }); await refreshUsers(); }
  async function updateOwnProfile(id, details) { return updateUser(id, details); }
  return <UserContext.Provider value={{ users, invitations, refreshUsers, inviteUser, resendInvite, revokeInvite, updateUser, deactivateUser, activateUser, deleteUser, updateOwnProfile }}>{children}</UserContext.Provider>;
}
export function useUsers() {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUsers must be used inside UserProvider");
  return value;
}
