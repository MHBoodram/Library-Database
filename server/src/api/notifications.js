import { sendJSON, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";
import {
  listUserNotifications,
  updateNotificationStatus,
  NOTIFICATION_STATUS,
} from "../lib/notifications.js";

function resolveUserId(auth) {
  return Number(auth?.uid || auth?.user_id || auth?.userId || 0);
}

export const listNotifications = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  const userId = resolveUserId(auth);
  if (!userId) {
    return sendJSON(res, 400, { error: "invalid_user" });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get("status") || "open";
  const limit = url.searchParams.get("limit") || undefined;

  try {
    const rows = await listUserNotifications(pool, userId, { status, limit });
    return sendJSON(res, 200, { rows });
  } catch (err) {
    console.error("Failed to list notifications:", err);
    return sendJSON(res, 500, { error: "notifications_query_failed" });
  }
};

export const markNotificationRead = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  const notificationId = Number(params.id);
  if (!notificationId) {
    return sendJSON(res, 400, { error: "invalid_notification" });
  }
  const userId = resolveUserId(auth);

  try {
    const updated = await updateNotificationStatus(pool, {
      notificationId,
      userId,
      status: NOTIFICATION_STATUS.READ,
    });
    if (!updated) {
      return sendJSON(res, 404, { error: "notification_not_found" });
    }
    return sendJSON(res, 200, { ok: true, status: NOTIFICATION_STATUS.READ });
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    return sendJSON(res, 500, { error: "notification_update_failed" });
  }
};

export const dismissNotification = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  const notificationId = Number(params.id);
  if (!notificationId) {
    return sendJSON(res, 400, { error: "invalid_notification" });
  }
  const userId = resolveUserId(auth);

  try {
    const updated = await updateNotificationStatus(pool, {
      notificationId,
      userId,
      status: NOTIFICATION_STATUS.RESOLVED,
    });
    if (!updated) {
      return sendJSON(res, 404, { error: "notification_not_found" });
    }
    return sendJSON(res, 200, { ok: true, status: NOTIFICATION_STATUS.RESOLVED });
  } catch (err) {
    console.error("Failed to dismiss notification:", err);
    return sendJSON(res, 500, { error: "notification_update_failed" });
  }
};
