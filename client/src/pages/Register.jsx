import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import NavBar from "../components/NavBar";

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm: "",
    make_employee: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
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
      // 1) Create the account (optionally flagged as staff on the server)
      await api("/auth/register", {
        method: "POST",
        body: { first_name, last_name, email, password, make_employee: form.make_employee },
      });

      nav("/login?registered=1", { replace: true, state: { email } });

    } catch (err) {
      setError(err?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
      <NavBar />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        paddingTop: '120px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          padding: 24,
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
        }}>
      <h1 style={{ marginTop: 0, textAlign: 'center' }}>Register</h1>

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
            display: 'block',
            margin: '0 auto',
            width: 'auto',
            maxWidth: 260,
            padding: '12px 28px',
            fontSize: 16,
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            textAlign: 'center'
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

        <p style={{ marginTop: 16, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
