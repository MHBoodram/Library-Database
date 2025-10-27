// src/TopBar.jsx
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  if (!user) return null;

  async function onLogout() {
    await logout();
    nav("/login");
  }

  return (
    <div style={{ padding: 12, background: "#f4f4f4", display: "flex", gap: 12 }}>
      <div>Signed in as <b>{user.name}</b> ({user.role})</div>
      <button onClick={onLogout}>Log out</button>
    </div>
  );
}
