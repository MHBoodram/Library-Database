import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Protected from "./components/Protected.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import EmployeeHome from "./pages/EmployeeHome.jsx";
import Books from "./pages/Books.jsx";
import Reports from "./pages/Reports.jsx";
import Loans from "./pages/Loans.jsx";
import Rooms from "./pages/Rooms.jsx";
import BookPage from "./pages/BookPage.jsx";
import ManageAccounts from "./pages/ManageAccounts.jsx";

import "./index.css";

// Lightweight wrapper to supply data fetchers for BookPage
function BookRoute() {
  const { useApi, user, token } = useAuth();
  
  const fetchBookById = async (id) => {
    const rows = await useApi(`items?id=${encodeURIComponent(id)}`);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;
    const copies = await useApi(`items/${id}/copies`);
    const availableCount = Array.isArray(copies)
      ? copies.filter((c) => c.status === "available").length
      : 0;
    const firstAuthor = Array.isArray(row?.authors) ? row.authors[0] : row?.authors;
    return {
      id: Number(id),
      title: row?.title || "",
      author: firstAuthor || "",
      publisher: row?.publisher || "",
      publishedYear: row?.publication_year || "",
      summary: row?.subject || "",
      coverUrl: null,
      rating: null,
      availableCount,
    };
  };

  const fetchRecommendations = async (id) => {
    const rows = await useApi(`items?id=${encodeURIComponent(id)}`);
    const row = Array.isArray(rows) ? rows[0] : rows;
    const firstAuthor = Array.isArray(row?.authors) ? row.authors[0] : row?.authors;
    if (!firstAuthor) return [];
    const recs = await useApi(`items?author=${encodeURIComponent(firstAuthor)}`);
    return (Array.isArray(recs) ? recs : [])
      .filter((r) => r.item_id !== Number(id))
      .slice(0, 10)
      .map((r) => ({ id: r.item_id, title: r.title, coverUrl: null }));
  };

  const onCheckout = async (id, qty = 1) => {
    if (!token) {
      alert("Please log in to checkout.");
      return;
    }
    try {
      const copies = await useApi(`items/${id}/copies`);
      const available = (copies || []).filter((c) => c.status === "available");
      if (!available.length) {
        alert("No available copies");
        return;
      }
      const toCheckout = available.slice(0, Math.max(1, Number(qty) || 1));

      let count = 0;
      for (const c of toCheckout) {
        try {
          await useApi("loans/checkout", { method: "POST", body: { copy_id: c.copy_id, user_id: user?.user_id } });
          count++;
        } catch (e) {
          const code = e?.data?.error || e?.message || "checkout_failed";
          const details = e?.data?.message || e?.data?.details || "";
          console.error("Checkout error:", code, details);
          alert(details || code);
          return; // stop on first error and do not show success
        }
      }
      alert(count > 1 ? `Checked out ${count} copies.` : "Checked out! Your loan will appear in Loans.");
    } catch (err) {
      const code = err?.data?.error || err?.message || "checkout_failed";
      const details = err?.data?.message || err?.data?.details || "";
      alert(details || code);
    }
  };

  return (
    <BookPage
      fetchBookById={fetchBookById}
      fetchRecommendations={fetchRecommendations}
      onCheckout={onCheckout}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Login" element={<Navigate to="/login" replace />} /> {/* optional redirect */}
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<Protected><BookRoute /></Protected>} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/rooms" element={<Rooms />} />
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
          <Route
            path="/manage/accounts"
            element={
              <Protected role="staff" employeeRole="admin">
                <ManageAccounts />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
