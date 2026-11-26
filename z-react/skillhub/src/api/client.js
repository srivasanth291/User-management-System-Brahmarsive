const AUTH_URL = import.meta.env.VITE_AUTH_API_URL || "http://127.0.0.1:5000";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(base, path, options = {}) {
  const token = sessionStorage.getItem("skillhub_access_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot connect to the server. Check that the backend is running.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) window.dispatchEvent(new Event("skillhub-session-expired"));
  if (!response.ok) throw new Error(data.detail || data.message || `Request failed (${response.status})`);
  return data;
}
export const authApi = (path, options) => request(AUTH_URL, path, options);
export const api = (path, options) => request(API_URL, path, options);
export const postJson = (data) => ({ method: "POST", body: JSON.stringify(data) });
