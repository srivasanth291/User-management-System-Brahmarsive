import { createContext, useContext, useEffect, useState } from "react";
import { api, authApi, postJson } from "../api/client";

const AuthContext = createContext(null);
const USER_KEY = "skillhub_current_user";
const TOKEN_KEY = "skillhub_access_token";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY)
        ? JSON.parse(sessionStorage.getItem(USER_KEY))
        : null;
    } catch {
      return null;
    }
  });
  const [checking, setChecking] = useState(
    Boolean(sessionStorage.getItem(TOKEN_KEY)),
  );

  useEffect(() => {
    if (!sessionStorage.getItem(TOKEN_KEY)) return;
    authApi("/api/auth/me")
      .then(({ user }) => setCurrentUser(user))
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setCurrentUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const expired = () => {
      sessionStorage.removeItem(TOKEN_KEY);
      setCurrentUser(null);
    };
    window.addEventListener("skillhub-session-expired", expired);
    return () =>
      window.removeEventListener("skillhub-session-expired", expired);
  }, []);

  useEffect(() => {
    if (currentUser)
      sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    else sessionStorage.removeItem(USER_KEY);
  }, [currentUser]);

  async function login(email, password) {
    const result = await authApi(
      "/api/auth/login",
      postJson({ email, password }),
    );
    sessionStorage.setItem(TOKEN_KEY, result.access_token);
    setCurrentUser(result.user);
    window.dispatchEvent(new Event("skillhub-auth-change"));
    return result.user;
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setCurrentUser(null);
    window.dispatchEvent(new Event("skillhub-auth-change"));
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, login, logout, checking }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
