// src/Login.jsx
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { login: doLogin } = useAuth(); // avoid name clash

  const [email, setEmail] = useState("patron@demo.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const me = await doLogin(email, password); // returns user object
      if (me.employee_id) {
        nav("/staff");
      } else {
        nav("/app");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "80px auto", display: "grid", gap: 12 }}>
      <h2>Library Login</h2>

      <label>
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      {/* removed Role select — backend decides via employee_id */}

      <button type="submit">Sign in</button>
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Demo: patron@demo.com / staff@demo.com (pw: demo123)
      </div>
    </form>
  );
}
