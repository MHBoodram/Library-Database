// src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";




const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);     // the logged-in user (or null)
  const [loading, setLoading] = useState(true);

  // Optional: try to restore an existing session on page load
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) setMe(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function login(email, password, actor) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, actor }),
    });
    if (!res.ok) throw new Error("Login failed");
    const user = await res.json();
    setMe(user);
    return user;
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setMe(null);
    }
  }

  const value = { me, setMe, login, logout, loading };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Route guards
export function RequireAuth({ children }) {
  const { me, loading } = useAuth();
  if (loading) return null;                      // or a tiny spinner
  if (!me) return <Navigate to="/Login" replace />;
  return children;
}

export function RequireRole({ role, children }) {
  const { me, loading } = useAuth();
  if (loading) return null;
  if (!me) return <Navigate to="/Login" replace />;
  if (role && me.role !== role) return <Navigate to="/" replace />;
  return children;
}
