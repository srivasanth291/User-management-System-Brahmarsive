
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      navigate(`/${user.role.toLowerCase()}/dashboard`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <h1>SkillHub Login</h1>

      <form onSubmit={handleLogin}>
        <label htmlFor="loginEmail">Email</label>

        <input
          id="loginEmail"
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="loginPassword">Password</label>

        <input
          id="loginPassword"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
      </form>
    </div>
  );
}

export default Login;
