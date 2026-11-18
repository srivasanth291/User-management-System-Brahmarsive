
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { setCurrentUser } = useAuth();
  const { users } = useUsers();

  function handleLogin(e) {
    e.preventDefault();

    const enteredEmail = email.trim().toLowerCase();

    if (enteredEmail === "") {
      alert("Please enter your email");
      return;
    }

    if (!enteredEmail.includes("@")) {
      alert("Please enter a valid email");
      return;
    }

    if (password === "") {
      alert("Please enter your password");
      return;
    }


    const user = users.find(
      (u) =>
        u.email.toLowerCase() === enteredEmail &&
        u.password === password
    );

    if (!user) {
      alert("Invalid email or password");
      return;
    }

    const status = user.status || "Active";

    if (status === "Pending") {
      alert(
        "Your invitation is pending. Please accept the invitation and set your password."
      );
      return;
    }

    if (status === "Deactivated") {
      alert(
        "Your account has been deactivated. Please contact the administrator."
      );
      return;
    }

    if (status !== "Active") {
      alert("Your account is not active.");
      return;
    }

    const {
      password: _password,
      inviteToken: _inviteToken,
      ...safeUser
    } = user;

    setCurrentUser(safeUser);

    navigate(`/${user.role.toLowerCase()}/dashboard`, {
      replace: true,
    });
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

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
