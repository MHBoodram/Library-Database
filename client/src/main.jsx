import React, { useState } from "react";
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
import PayFines from "./pages/PayFines.jsx";
import Rooms from "./pages/Rooms.jsx";
import BookPage from "./pages/BookPage.jsx";
import Locked from "./pages/Locked.jsx";
import { getCustomCoverForTitle, DEFAULT_BOOK_PLACEHOLDER } from "./coverImages";
import ManageAccounts from "./pages/ManageAccounts.jsx";
import Notifications from "./pages/Notifications.jsx";
import { ToastBanner } from "./components/staff/shared/Feedback.jsx";

import "./index.css";
import ReadyHoldNotifications from "./components/ReadyHoldNotifications.jsx";

// Lightweight wrapper to supply data fetchers for BookPage
function BookRoute() {
  const { useApi, user, token } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = (payload) => {
    if (!payload) return;
    setToast({ id: Date.now(), ...payload });
  };
  
  const fetchBookById = async (id) => {
    const rows = await useApi(`items?id=${encodeURIComponent(id)}`);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;
    const copies = await useApi(`items/${id}/copies`);
    const availableCount = Array.isArray(copies)
      ? copies.filter((c) => c.status === "available").length
      : 0;
    const firstAuthor = Array.isArray(row?.authors) ? row.authors[0] : row?.authors;
    const mappedCover = getCustomCoverForTitle(row?.title);
    return {
      id: Number(id),
      title: row?.title || "",
      author: firstAuthor || "",
      publisher: row?.publisher || "",
      publishedYear: row?.publication_year || "",
      summary: row?.subject || "",
      coverUrl: mappedCover || null,
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
      .map((r) => ({ id: r.item_id, title: r.title, coverUrl: getCustomCoverForTitle(r.title) || null }));
  };

  const onCheckout = async (id, qty = 1) => {
    if (!token) {
      showToast({ type: "error", text: "Please log in to checkout." });
      return false;
    }
    try {
      const copies = await useApi(`items/${id}/copies`);
      const available = (copies || []).filter((c) => c.status === "available");
      if (!available.length) {
        showToast({ type: "error", text: "No available copies." });
        return false;
      }
      const first = available[0];
      await useApi('loans/checkout', { method: 'POST', body: { copy_id: first.copy_id } });
      showToast({ type: "success", text: "Item checked out! View it under Manage Loans." });
      return true;
    } catch (err) {
      const code = err?.data?.error || err?.message || "checkout_failed";
      const details = err?.data?.message || err?.data?.details || "";
      showToast({ type: "error", text: details || code });
      return false;
    }
  };

  return (
    <>
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
      <BookPage
        fetchBookById={fetchBookById}
        fetchRecommendations={fetchRecommendations}
        onCheckout={onCheckout}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ReadyHoldNotifications />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Login" element={<Navigate to="/login" replace />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<Protected><BookRoute /></Protected>} />
          <Route path="/loans" element={<Loans />} />
          <Route
            path="/notifications"
            element={
              <Protected>
                <Notifications />
              </Protected>
            }
          />
          <Route path="/fines" element={<Protected><PayFines /></Protected>} />
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
          <Route
            path = "/Locked"
            element = {<Locked />}
            />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
