import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { listMyHolds } from "../api";
import { formatDateTime } from "../utils";
import "./ReadyHoldNotifications.css";

const POLL_INTERVAL_MS = 60_000; // 1 minute
const TOAST_LIFESPAN_MS = 12_000;
const STORAGE_KEY = "ready-hold-notifications";

function normalizeRows(payload) {
  if (!payload) return [];
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
}

function holdKey(hold) {
  const since = hold?.available_since || "pending";
  return `${hold?.hold_id ?? "unknown"}:${since}`;
}

function loadSeenKeys() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function persistSeenKeys(set) {
  // Keep the most recent 50 entries to avoid uncontrolled growth
  const keys = Array.from(set).slice(-50);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export default function ReadyHoldNotifications() {
  const { token } = useAuth();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const seenRef = useRef(loadSeenKeys());

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    const timer = timersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(toastId);
    }
  }, []);

  const queueToast = useCallback(
    (hold) => {
      const key = holdKey(hold);
      const toast = {
        id: key,
        title: hold?.item_title || "Hold ready for pickup",
        window:
          hold?.available_since && hold?.expires_at
            ? `${formatDateTime(hold.available_since)} - ${formatDateTime(hold.expires_at)}`
            : null,
      };
      setToasts((prev) => [...prev, toast]);
      if (timersRef.current.has(key)) {
        clearTimeout(timersRef.current.get(key));
      }
      const timeout = setTimeout(() => dismissToast(key), TOAST_LIFESPAN_MS);
      timersRef.current.set(key, timeout);
    },
    [dismissToast]
  );

  useEffect(() => {
    if (!token) {
      // If the user logs out, clear visible notifications but keep the seen set
      setToasts([]);
      return undefined;
    }

    let cancelled = false;
    let timerId;

    async function poll() {
      try {
        const data = await listMyHolds(token);
        if (cancelled) return;
        const rows = normalizeRows(data);
        rows
          .filter((hold) => hold?.status === "ready")
          .forEach((hold) => {
            const key = holdKey(hold);
            if (seenRef.current.has(key)) return;
            seenRef.current.add(key);
            persistSeenKeys(seenRef.current);
            queueToast(hold);
          });
      } catch (err) {
        if (err?.status !== 401) {
          console.warn("Hold notification poll failed", err);
        }
      } finally {
        if (!cancelled) {
          timerId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [queueToast, token]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timeout) => clearTimeout(timeout));
      timersRef.current.clear();
    };
  }, []);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="ready-hold-notifier" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <section key={toast.id} className="ready-hold-toast" role="status">
          <div className="ready-hold-toast__badge">Hold Ready</div>
          <div className="ready-hold-toast__content">
            <p className="ready-hold-toast__title">{toast.title}</p>
            {toast.window && <p className="ready-hold-toast__window">Pickup window: {toast.window}</p>}
          </div>
          <button
            type="button"
            className="ready-hold-toast__dismiss"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            {"\u00d7"}
          </button>
        </section>
      ))}
    </div>
  );
}
