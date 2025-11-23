// src/components/Protected.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Protected({ children, role, employeeRole }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.locked) return <Navigate to="/Locked" replace />;
  if (role && user?.role !== role) return <Navigate to="/app" replace />;
  if (employeeRole) {
    const allowed = Array.isArray(employeeRole) ? employeeRole : [employeeRole];
    if (!user?.employee_role || !allowed.includes(user.employee_role)) {
      return <Navigate to="/app" replace />;
    }
  }
  return children;
}
