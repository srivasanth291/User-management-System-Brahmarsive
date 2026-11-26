import { useEffect, useState, useCallback } from "react";
import { api, postJson } from "../api/client";
import { UserContext } from "./useUsers";
export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const refreshUsers = useCallback(async () => {
    const token = sessionStorage.getItem("skillhub_access_token");
    if (!token) { setUsers([]); setInvitations([]); return; }
    const { user } = await api("/api/users/me");
    const directory = [user];
    let invitations = [];
    if (user.role !== "student") {
      if (user.role === "admin" || user.permissions.includes("view_students")) {
        let page = 1;
        let loaded = 0;
        let result;
        do {
          result = await api(`/api/users?limit=100&page=${page++}`);
          directory.push(...result.users.filter(item => item.id !== user.id));
          loaded += result.users.length;
        } while (loaded < result.total && result.users.length);
      }
      invitations = (await api("/api/invitations")).invitations;
    }
    if (sessionStorage.getItem("skillhub_access_token") !== token) return;
    setInvitations(invitations);
    setUsers([...(directory).map(user => ({ ...user, status: user.isActive ? "Active" : "Deactivated" })), ...(invitations).filter(inv => inv.status === "pending").map(inv => ({ ...inv, id: `invite-${inv.id}`, name: inv.email.split("@")[0], status: "Pending", inviteId: inv.id }))]);
  }, []);
  useEffect(() => {
    const listener = () => refreshUsers().catch(console.error);
    window.addEventListener("skillhub-auth-change", listener);
    window.addEventListener("skillhub-session-expired", listener);
    listener();
    return () => {
      window.removeEventListener("skillhub-auth-change", listener);
      window.removeEventListener("skillhub-session-expired", listener);
    };
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
    const { name, email, phone, isActive } = details;
    await api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ name, email, phone, ...(isActive === undefined ? {} : { isActive }) }) });
    if (details.role === "staff" && Array.isArray(details.permissions)) {
      await api(`/api/users/${id}/permissions`, { method: "PUT", body: JSON.stringify({ permissions: details.permissions }) });
    }
    await refreshUsers();
  }
  async function deactivateUser(id) { return updateUser(id, { isActive: false }); }
  async function activateUser(id) { return updateUser(id, { isActive: true }); }
  async function deleteUser(id) { await api(`/api/users/${id}`, { method: "DELETE" }); await refreshUsers(); }
  async function updateOwnProfile(id, details) { return updateUser(id, details); }
  return <UserContext.Provider value={{ users, invitations, refreshUsers, inviteUser, resendInvite, revokeInvite, updateUser, deactivateUser, activateUser, deleteUser, updateOwnProfile }}>{children}</UserContext.Provider>;
}
