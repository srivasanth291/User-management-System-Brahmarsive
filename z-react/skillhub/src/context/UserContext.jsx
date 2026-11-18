import { createContext, useContext, useEffect, useState } from "react";
import { users as initialUsers } from "../data/users";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("skillhub_users");

      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  useEffect(() => {
    localStorage.setItem("skillhub_users", JSON.stringify(users));
  }, [users]);

  function inviteUser(details) {
    const email = details.email.trim().toLowerCase();

    if (details.role !== "staff" && details.role !== "student") {
      return { ok: false, message: "Invalid user role." };
    }

    if (users.some((user) => user.email.toLowerCase() === email)) {
      return { ok: false, message: "Email already exists." };
    }

    const newUser = {
      id: crypto.randomUUID(),
      name: details.name.trim(),
      email,
      role: details.role,
      status: "Pending",
      password: "",
      permissions: details.role === "staff" ? details.permissions || [] : [],
      inviteToken: crypto.randomUUID(),
      invitedAt: new Date().toISOString(),
      lastLogin: null,
    };

    setUsers((previous) => [...previous, newUser]);

    return { ok: true, user: newUser };
  }

  function resendInvite(id) {
    const user = users.find(
      (item) =>
        String(item.id) === String(id) &&
        item.status === "Pending" &&
        item.role !== "admin",
    );

    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      password: "",
      inviteToken: crypto.randomUUID(),
      invitedAt: new Date().toISOString(),
    };

    setUsers((previous) =>
      previous.map((item) =>
        String(item.id) === String(id) ? updatedUser : item,
      ),
    );

    return updatedUser;
  }

  function acceptInvite(token, password) {
    const user = users.find(
      (item) =>
        item.status === "Pending" &&
        item.inviteToken === token &&
        item.role !== "admin",
    );

    if (!user) {
      return {
        ok: false,
        message: "Invitation is invalid or already accepted.",
      };
    }

    if (password.length < 8) {
      return {
        ok: false,
        message: "Password must contain at least 8 characters.",
      };
    }
    setUsers((previous) =>
      previous.map((item) =>
        String(item.id) === String(user.id)
          ? {
              ...item,
              status: "Active",
              password,
              inviteToken: null,
            }
          : item,
      ),
    );

    return { ok: true };
  }

  function updateUser(id, details) {
    setUsers((previous) =>
      previous.map((user) => {
        if (String(user.id) !== String(id) || user.role === "admin") {
          return user;
        }

        return {
          ...user,
          name: details.name,
          email: details.email,
          phone: details.phone ?? user.phone ?? "",
          role: details.role,
          permissions:
            details.role === "staff" ? details.permissions || [] : [],
        };
      }),
    );
  }

  function deactivateUser(id) {
    setUsers((previous) =>
      previous.map((user) => {
        if (
          String(user.id) === String(id) &&
          (user.status || "Active").toLowerCase() === "active" &&
          (user.role || "").toLowerCase() !== "admin"
        ) {
          return {
            ...user,
            status: "Deactivated",
          };
        }

        return user;
      }),
    );
  }

  function activateUser(id) {
    setUsers((previous) =>
      previous.map((user) =>
        String(user.id) === String(id) &&
        user.status === "Deactivated" &&
        user.role !== "admin"
          ? { ...user, status: "Active" }
          : user,
      ),
    );
  }

  function revokeInvite(id) {
    setUsers((previous) =>
      previous.filter(
        (user) => String(user.id) !== String(id) || user.status !== "Pending",
      ),
    );
  }

  function deleteUser(id) {
    setUsers((previous) =>
      previous.filter(
        (user) =>
          String(user.id) !== String(id) ||
          user.status !== "Deactivated" ||
          user.role === "admin",
      ),
    );
  }
  function updateOwnProfile(id, details) {
    setUsers((previous) =>
      previous.map((user) => {
        if (
          String(user.id) === String(id) &&
          user.role.toLowerCase() === "admin"
        ) {
          return {
            ...user,
            name: details.name,
            email: details.email,
            phone: details.phone,
          };
        }

        return user;
      }),
    );
  }
  return (
    <UserContext.Provider
      value={{
        users,
        inviteUser,
        resendInvite,
        acceptInvite,
        updateUser,
        deactivateUser,
        activateUser,
        revokeInvite,
        deleteUser,
        updateOwnProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUsers must be used inside UserProvider");
  }

  return context;
}
