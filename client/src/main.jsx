// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider, RequireAuth, RequireRole } from "./AuthContext";
import Login from "./Login.jsx";
import PatronDashboard from "./pages/PatronDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import "./index.css";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  { path: "/app",
    element: (
      <RequireAuth>
        <PatronDashboard />
      </RequireAuth>
    )
  },

  { path: "/staff",
    element: (
      <RequireRole role="employee">
        <StaffDashboard />
      </RequireRole>
    )
  },

  { path: "/", element: <Login /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
