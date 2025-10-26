import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function Register() {
  const nav = useNavigate();
  const { Login } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const first_name = form.first_name.trim();
    const last_name  = form.last_name.trim();
    const email      = form.email.trim().toLowerCase();
    const password   = form.password;

    if (!first_name || !last_name || !email || !password) {
      return setError("All fields are required.");
    }
    if (password !== form.confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      // 1) Create the account (role defaults to "student" on the server)
      await api("/auth/register", {
        method: "POST",
        body: { first_name, last_name, email, password },
      });

      // 2) Auto-login so the app is immediately authenticated
      const user = await Login(email, password);

      // 3) Route by role
      if (user.role === "staff") nav("/staff", { replace: true });
      else nav("/app", { replace: true });
    } catch (err) {
      setError(err?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: 24 }}>
      <h1>Register</h1>

      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: "#fee",
            color: "#c00",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>First Name</label>
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Last Name</label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Confirm Password</label>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={onChange}
            required
            minLength={6}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: 16, textAlign: "center" }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}
