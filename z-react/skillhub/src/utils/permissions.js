
export function hasPermission(user, permission) {
  if (!user) return false;

  const role = String(user.role || "").toLowerCase();

  if (role === "admin") return true;

  if (role !== "staff") return false;

  const permissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  return permissions.includes(permission);
}
