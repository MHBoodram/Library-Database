export const NOTIFICATION_TYPES = Object.freeze({
  HOLD_READY: "hold_ready",
  HOLD_LIFTED: "hold_lifted",
  ROOM_EXPIRING: "room_expiring",
  ROOM_EXPIRED: "room_expired",
  DUE_SOON: "due_soon",
  OVERDUE: "overdue",
  LOST_WARNING: "lost_warning",
  LOST_MARKED: "lost_marked",
  SUSPENDED: "suspended",
  SYSTEM: "system",
});

export const NOTIFICATION_STATUS = Object.freeze({
  UNREAD: "unread",
  READ: "read",
  RESOLVED: "resolved",
});

function ensureRunner(runner) {
  if (!runner || typeof runner.query !== "function") {
    throw new Error("A database connection or pool is required.");
  }
  return runner;
}

function serializeMetadata(meta) {
  if (!meta) return null;
  try {
    return JSON.stringify(meta);
  } catch {
    return null;
  }
}

export function parseMetadata(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function mapNotificationRow(row) {
  if (!row) return row;
  return {
    ...row,
    metadata: parseMetadata(row.metadata),
  };
}

export async function listUserNotifications(runner, userId, { status = "open", limit = 25 } = {}) {
  const conn = ensureRunner(runner);
  const filters = ["n.user_id = ?"];
  const params = [userId];

  switch (status) {
    case "unread":
      filters.push("n.status = 'unread'");
      break;
    case "resolved":
      filters.push("n.status = 'resolved'");
      break;
    case "all":
      break;
    default:
      filters.push("n.status IN ('unread','read')");
      break;
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100));
  const [rows] = await conn.query(
    `
      SELECT
        n.notification_id,
        n.user_id,
        n.type,
        n.status,
        n.title,
        n.message,
        n.action_required,
        n.metadata,
        n.hold_id,
        n.item_id,
        n.copy_id,
        n.created_at,
        n.read_at,
        n.resolved_at
      FROM notification n
      WHERE ${filters.join(" AND ")}
      ORDER BY n.created_at DESC, n.notification_id DESC
      LIMIT ?
    `,
    [...params, safeLimit]
  );
  return rows.map(mapNotificationRow);
}

export async function notificationExists(runner, { userId, type, hint }) {
  const conn = ensureRunner(runner);
  if (!userId || !type) return false;
  const likeHint = hint ? `%${hint}%` : null;
  const [rows] = await conn.query(
    `
      SELECT notification_id
      FROM notification
      WHERE user_id = ?
        AND type = ?
        ${likeHint ? "AND metadata LIKE ?" : ""}
      LIMIT 1
    `,
    likeHint ? [userId, type, likeHint] : [userId, type]
  );
  return rows.length > 0;
}

export async function createNotification(conn, { userId, type, title, message, actionRequired = false, metadata = null, status = NOTIFICATION_STATUS.UNREAD }) {
  if (!userId || !type) return;
  await conn.execute(
    `
      INSERT INTO notification (
        user_id,
        hold_id,
        item_id,
        copy_id,
        type,
        status,
        title,
        message,
        action_required,
        metadata
      )
      VALUES (?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      type,
      status,
      title || "Notification",
      message || "",
      actionRequired ? 1 : 0,
      serializeMetadata(metadata),
    ]
  );
}

export async function updateNotificationStatus(runner, { notificationId, userId, status }) {
  if (!Object.values(NOTIFICATION_STATUS).includes(status)) {
    throw new Error(`Invalid notification status: ${status}`);
  }
  const conn = ensureRunner(runner);
  const [result] = await conn.execute(
    `
      UPDATE notification
      SET
        status = ?,
        read_at = CASE
          WHEN ? = 'read' AND read_at IS NULL THEN NOW()
          WHEN ? = 'resolved' THEN NOW()
          ELSE read_at
        END,
        resolved_at = CASE
          WHEN ? = 'resolved' THEN NOW()
          ELSE resolved_at
        END
      WHERE notification_id = ?
        AND user_id = ?
    `,
    [
      status,
      status,
      status,
      status,
      notificationId,
      userId,
    ]
  );
  if (result.affectedRows > 0) return true;
  const [rows] = await conn.query(
    "SELECT status FROM notification WHERE notification_id = ? AND user_id = ? LIMIT 1",
    [notificationId, userId]
  );
  if (!rows.length) return false;
  return rows[0].status === status;
}

export async function resolveHoldNotifications(conn, holdId, status = NOTIFICATION_STATUS.RESOLVED) {
  if (!holdId) return;
  await conn.execute(
    `
      UPDATE notification
      SET
        status = ?,
        read_at = CASE WHEN read_at IS NULL THEN NOW() ELSE read_at END,
        resolved_at = NOW()
      WHERE hold_id = ?
        AND status <> 'resolved'
    `,
    [status, holdId]
  );
}

export async function createHoldReadyNotification(conn, { holdId, userId, itemId, copyId, itemTitle, availableSince, expiresAt, queuePosition }) {
  if (!holdId || !userId) return;
  const metadata = {
    hold_id: holdId,
    item_id: itemId ?? null,
    copy_id: copyId ?? null,
    item_title: itemTitle || null,
    available_since: availableSince ? new Date(availableSince).toISOString() : null,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    queue_position: queuePosition ?? null,
  };
  await conn.execute(
    `
      INSERT INTO notification (
        user_id,
        hold_id,
        item_id,
        copy_id,
        type,
        status,
        title,
        message,
        action_required,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      holdId,
      itemId ?? null,
      copyId ?? null,
      NOTIFICATION_TYPES.HOLD_READY,
      NOTIFICATION_STATUS.UNREAD,
      itemTitle ? `Hold ready: ${itemTitle}` : "Hold ready for pickup",
      itemTitle
        ? `A copy of "${itemTitle}" is ready for pickup.`
        : "A hold you placed is ready for pickup.",
      1,
      serializeMetadata(metadata),
    ]
  );
}
