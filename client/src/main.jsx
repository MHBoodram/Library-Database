import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./AuthContext.jsx";
import Protected from "./components/Protected.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import EmployeeHome from "./pages/EmployeeHome.jsx";
import Books from "./pages/Books.jsx";
import Reports from "./pages/Reports.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Login" element={<Navigate to="/login" replace />} /> {/* optional redirect */}
          <Route path="/register" element={<Register />} />
          <Route path="/books" element={<Books />} />
          <Route path="/reports" element={<Reports />} />

          <Route
            path="/app"
            element={
              <Protected>
                <Login />
              </Protected>
            }
          />

          <Route
            path="/staff"
            element={
              <Protected role="staff">
                <EmployeeHome />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
