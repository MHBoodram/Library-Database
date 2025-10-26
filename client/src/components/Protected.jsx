// src/components/Protected.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Protected({ children, role }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/app" replace />;
  return children;
}
