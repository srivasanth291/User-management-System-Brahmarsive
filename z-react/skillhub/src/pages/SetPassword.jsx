
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import "./Login.css";

function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { users, acceptInvite } = useUsers();

  const token = searchParams.get("token");

  const invitedUser = users.find(
    (user) =>
      user.inviteToken === token &&
      user.status === "Pending" &&
      user.role !== "admin"
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = acceptInvite(token, password);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    alert("Account activated! Please log in.");
    navigate("/login", { replace: true });
  }

  if (!token || !invitedUser) {
    return (
      <div className="login">
        <h1>Invalid Invitation</h1>
        <p>This invitation is invalid or already accepted.</p>

        <button onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="login">
      <h1>Set Your Password</h1>

      <p>
        Welcome, <strong>{invitedUser.name}</strong>
      </p>

      <p style={{ fontSize: 13, color: "#64748b" }}>
        {invitedUser.email}
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          type="password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          autoComplete="new-password"
          required
        />

        {error && (
          <p role="alert" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}

        <button type="submit">
          Set Password & Activate Account
        </button>
      </form>
    </div>
  );
}

export default SetPassword;
