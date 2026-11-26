import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, postJson } from "../api/client";
import "./Login.css";

export default function SetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  return <RegistrationForm key={token} token={token} />;
}

function RegistrationForm({ token }) {
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(token ? "" : "Invitation token is missing.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    api(`/api/invitations/verify?token=${encodeURIComponent(token)}`)
      .then(setInvitation).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSaving(true); setError("");
    try {
      await api("/api/invitations/register", postJson({ token, name: name.trim(), password }));
      navigate("/login", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div className="login">
    <h1>Accept SkillHub Invitation</h1>
    {loading ? <p>Checking invitation...</p> : invitation ? <>
      <p>Invited as <strong>{invitation.role}</strong> — {invitation.email}</p>
      <form onSubmit={submit}>
        <label htmlFor="inviteName">Your name</label>
        <input id="inviteName" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={150} required />
        <label htmlFor="invitePassword">Create password</label>
        <input id="invitePassword" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        <label htmlFor="inviteConfirm">Confirm password</label>
        <input id="inviteConfirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        {error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
        <button type="submit" disabled={saving}>{saving ? "Creating account..." : "Activate account"}</button>
      </form>
    </> : <p>Invitation unavailable or expired.</p>}
    {!invitation && error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
  </div>;
}
