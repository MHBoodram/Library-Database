import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useAuth } from "../AuthContext";
import "./Notifications.css";
import {
  listNotifications as fetchNotifications,
  markNotificationRead,
  dismissNotification,
  acceptReadyHold,
  declineReadyHold,
} from "../api";
import { formatDateTime } from "../utils";

const normalizeRows = (payload) => {
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
};

const FILTER_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Unread", value: "unread" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "all" },
];

const HOLD_READY = "hold_ready";
const HOLD_LIFTED = "hold_lifted";
const ROOM_EXPIRING = "room_expiring";
const ROOM_EXPIRED = "room_expired";
const DUE_SOON = "due_soon";
const OVERDUE = "overdue";
const LOST_WARNING = "lost_warning";
const LOST_MARKED = "lost_marked";
const SUSPENDED = "suspended";

function getFriendlyError(err, fallback = "Something went wrong.") {
  const code = err?.data?.error;
  if (code === "notifications_query_failed") {
    return "Notifications aren't ready yet. Run server/sql/add_notifications_table.sql on the database and restart the API.";
  }
  if (code === "notification_not_found") {
    return "That notification no longer exists.";
  }
  if (code === "notification_update_failed") {
    return "We couldn't update that notification. Try again in a moment.";
  }
  return err?.data?.message || err?.message || fallback;
}

export default function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("open");
  const [pending, setPending] = useState({});

  const loadNotifications = useCallback(
    async (statusOverride) => {
      if (!token) {
        navigate("/login");
        return;
      }
      const status = statusOverride || "open";
      setLoading(true);
      setError("");
      try {
        const data = await fetchNotifications(token, { status, limit: 50 });
        setNotifications(normalizeRows(data));
      } catch (err) {
        setError(getFriendlyError(err, "Failed to load notifications."));
      } finally {
        setLoading(false);
      }
    },
    [navigate, token]
  );

  useEffect(() => {
    loadNotifications(filter);
  }, [filter, loadNotifications]);

  const visibleNotifications = useMemo(
    () => notifications.map((n) => ({ ...n, metadata: n.metadata || {} })),
    [notifications]
  );

  const updatePending = (id, value) => {
    setPending((prev) => ({ ...prev, [id]: value }));
  };
  const clearPending = (id) => {
    setPending((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleMarkRead = async (notificationId) => {
    if (!token) return;
    updatePending(notificationId, "read");
    try {
      await markNotificationRead(token, notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId
            ? { ...n, status: "read", read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      setError(getFriendlyError(err, "Unable to mark notification as read."));
    } finally {
      clearPending(notificationId);
    }
  };

  const handleDismiss = async (notificationId) => {
    if (!token) return;
    updatePending(notificationId, "dismiss");
    try {
      await dismissNotification(token, notificationId);
      await loadNotifications(filter);
    } catch (err) {
      setError(getFriendlyError(err, "Unable to dismiss notification."));
    } finally {
      clearPending(notificationId);
    }
  };

  const handleHoldAction = async (notification, action) => {
    if (!token || !notification?.metadata?.hold_id) return;
    const holdId = notification.metadata.hold_id;
    const notificationId = notification.notification_id;
    updatePending(notificationId, action);
    setError("");
    try {
      if (action === "accept") {
        await acceptReadyHold(token, holdId);
      } else {
        await declineReadyHold(token, holdId);
      }
      await dismissNotification(token, notificationId).catch(() => {});
      await loadNotifications(filter);
    } catch (err) {
      setError(getFriendlyError(err, "Unable to update hold."));
    } finally {
      clearPending(notificationId);
    }
  };

  const currentFilterLabel = FILTER_OPTIONS.find((f) => f.value === filter)?.label || "Open";

  const typeLabel = (type) => {
    switch (type) {
      case HOLD_READY: return "Hold ready";
      case HOLD_LIFTED: return "Hold lifted";
      case ROOM_EXPIRING: return "Room ending soon";
      case ROOM_EXPIRED: return "Room ended";
      case DUE_SOON: return "Due soon";
      case OVERDUE: return "Overdue";
      case LOST_WARNING: return "Lost warning";
      case LOST_MARKED: return "Lost marked";
      case SUSPENDED: return "Suspended";
      default: return type?.replace(/_/g, " ") || "";
    }
  };

  const renderMeta = (notification) => {
    const meta = notification.metadata || {};
    switch (notification.type) {
      case HOLD_READY:
        return (
          <dl className="notification-card__meta">
            {meta.item_title && (
              <div>
                <dt>Item</dt>
                <dd>{meta.item_title}</dd>
              </div>
            )}
            {meta.available_since && meta.expires_at && (
              <div>
                <dt>Pickup window</dt>
                <dd>{formatDateTime(meta.available_since)} - {formatDateTime(meta.expires_at)}</dd>
              </div>
            )}
            {meta.queue_position !== undefined && meta.queue_position !== null && (
              <div>
                <dt>Queue position</dt>
                <dd>#{meta.queue_position}</dd>
              </div>
            )}
          </dl>
        );
      case HOLD_LIFTED:
        return (
          <dl className="notification-card__meta">
            {meta.item_title && (
              <div>
                <dt>Item</dt>
                <dd>{meta.item_title}</dd>
              </div>
            )}
          </dl>
        );
      case ROOM_EXPIRING:
      case ROOM_EXPIRED:
        return (
          <dl className="notification-card__meta">
            {meta.room_number && (
              <div>
                <dt>Room</dt>
                <dd>{meta.room_number}</dd>
              </div>
            )}
            {meta.start_time && meta.end_time && (
              <div>
                <dt>Time</dt>
                <dd>{formatDateTime(meta.start_time)} - {formatDateTime(meta.end_time)}</dd>
              </div>
            )}
          </dl>
        );
      case DUE_SOON:
      case OVERDUE:
      case LOST_WARNING:
      case LOST_MARKED:
      case SUSPENDED:
        return (
          <dl className="notification-card__meta">
            {meta.item_title && (
              <div>
                <dt>Item</dt>
                <dd>{meta.item_title}</dd>
              </div>
            )}
            {meta.due_date && (
              <div>
                <dt>Due</dt>
                <dd>{formatDateTime(meta.due_date)}</dd>
              </div>
            )}
            {meta.suspend_after && (notification.type === LOST_WARNING || notification.type === SUSPENDED) && (
              <div>
                <dt>Suspension after</dt>
                <dd>{formatDateTime(meta.suspend_after)}</dd>
              </div>
            )}
          </dl>
        );
      default:
        return null;
    }
  };

  return (
    <div className="notifications-page">
      <NavBar />
      <main className="notifications-content">
        <header className="notifications-header">
          <div>
            <p className="notifications-eyebrow">Notifications</p>
            <h1>Stay on top of your account</h1>
          </div>
          <div className="notifications-filter">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={option.value === filter ? "active" : ""}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {error && <div className="notifications-error">{error}</div>}
        {loading ? (
          <div className="notifications-loading">Loading notifications...</div>
        ) : visibleNotifications.length === 0 ? (
          <div className="notifications-empty">
            <p>No {currentFilterLabel.toLowerCase()} notifications right now.</p>
            <p>We'll post updates here as soon as something needs your attention.</p>
          </div>
        ) : (
          <ul className="notification-list">
            {visibleNotifications.map((notification) => {
              const status = notification.status || "unread";
              const isHoldReady = notification.type === HOLD_READY;
              const meta = notification.metadata || {};
              const processing = pending[notification.notification_id];

              return (
                <li key={notification.notification_id} className={`notification-card ${status}`}>
                  <div className="notification-card__header">
                    <div>
                      <p className="notification-card__title">{notification.title}</p>
                      <p className="notification-card__timestamp">{formatDateTime(notification.created_at)}</p>
                    </div>
                    <span className={`notification-card__status badge-${status}`}>
                      {typeLabel(notification.type) || (status === "resolved" ? "Resolved" : status === "read" ? "Read" : "Unread")}
                    </span>
                  </div>
                  <p className="notification-card__message">{notification.message}</p>

                  {renderMeta(notification)}

                  <div className="notification-card__actions">
                    {isHoldReady && status !== "resolved" && (
                      <div className="notification-card__cta">
                        <button
                          type="button"
                          className="primary"
                          onClick={() => handleHoldAction(notification, "accept")}
                          disabled={Boolean(processing)}
                        >
                          {processing === "accept" ? "Checking out..." : "Check out this item"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHoldAction(notification, "decline")}
                          disabled={Boolean(processing)}
                        >
                          {processing === "decline" ? "Updating..." : "No thanks"}
                        </button>
                      </div>
                    )}

                    <div className="notification-card__secondary">
                      {status === "unread" && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification.notification_id)}
                          disabled={Boolean(processing)}
                        >
                          Mark as read
                        </button>
                      )}
                      {status !== "resolved" && (
                        <button
                          type="button"
                          className="muted"
                          onClick={() => handleDismiss(notification.notification_id)}
                          disabled={Boolean(processing)}
                        >
                          {processing === "dismiss" ? "Dismissing..." : "Dismiss"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
