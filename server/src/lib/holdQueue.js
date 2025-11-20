import { createHoldReadyNotification, resolveHoldNotifications } from "./notifications.js";

export const HOLD_PICKUP_WINDOW_HOURS = Number(process.env.HOLD_PICKUP_WINDOW_HOURS || 48);
export const HOLD_LIMITS = {
  student: Number(process.env.HOLD_LIMIT_STUDENT || 5),
  faculty: Number(process.env.HOLD_LIMIT_FACULTY || 7),
  staff: Number(process.env.HOLD_LIMIT_STAFF || 5),
  admin: Number(process.env.HOLD_LIMIT_ADMIN || 5),
};

function normalizeRole(role) {
  return (role || "student").toLowerCase();
}

export function holdLimitForRole(role) {
  const normalized = normalizeRole(role);
  return HOLD_LIMITS[normalized] ?? HOLD_LIMITS.student;
}

export async function fetchUserRole(conn, userId) {
  const [rows] = await conn.query(
    "SELECT role FROM account WHERE user_id = ? ORDER BY account_id ASC LIMIT 1",
    [userId]
  );
  return normalizeRole(rows[0]?.role);
}

export async function expireReadyHolds(conn) {
  const [rows] = await conn.query(
    `
      SELECT hold_id, item_id, copy_id
      FROM hold
      WHERE status = 'ready'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
      FOR UPDATE
    `
  );
  if (!rows.length) return 0;

  for (const row of rows) {
    await conn.execute(
      "UPDATE hold SET status='expired', copy_id=NULL, available_since=NULL, expires_at=NULL WHERE hold_id=?",
      [row.hold_id]
    );
    await resolveHoldNotifications(conn, row.hold_id);
    if (row.copy_id) {
      await conn.execute("UPDATE copy SET status='available' WHERE copy_id=?", [row.copy_id]);
      await assignCopyToNextHold(conn, row.copy_id, row.item_id);
    }
  }
  return rows.length;
}

export async function assignAvailableCopiesForItem(conn, itemId) {
  if (!itemId) return 0;
  const [copies] = await conn.query(
    `
      SELECT copy_id, item_id
      FROM copy
      WHERE item_id = ?
        AND status = 'available'
      ORDER BY copy_id ASC
      FOR UPDATE
    `,
    [itemId]
  );
  let assigned = 0;
  for (const copy of copies) {
    const holdId = await assignCopyToNextHold(conn, copy.copy_id, copy.item_id);
    if (holdId) assigned += 1;
  }
  return assigned;
}

export async function assignAvailableCopies(conn) {
  const [copies] = await conn.query(
    `
      SELECT c.copy_id, c.item_id
      FROM copy c
      WHERE c.status = 'available'
        AND EXISTS (
          SELECT 1 FROM hold h
          WHERE h.item_id = c.item_id
            AND h.status = 'queued'
        )
      ORDER BY c.item_id ASC, c.copy_id ASC
      FOR UPDATE
    `
  );
  let assigned = 0;
  for (const copy of copies) {
    const holdId = await assignCopyToNextHold(conn, copy.copy_id, copy.item_id);
    if (holdId) assigned += 1;
  }
  return assigned;
}

export async function assignCopyToNextHold(conn, copyId, explicitItemId = null) {
  const [copyRows] = await conn.query(
    "SELECT copy_id, item_id FROM copy WHERE copy_id = ? FOR UPDATE",
    [copyId]
  );
  if (!copyRows.length) return null;
  const itemId = explicitItemId ?? copyRows[0].item_id;

  const [holdRows] = await conn.query(
    `
      SELECT hold_id, user_id, queue_position
      FROM hold
      WHERE item_id = ?
        AND status = 'queued'
      ORDER BY queue_position ASC, hold_id ASC
      LIMIT 1
      FOR UPDATE
    `,
    [itemId]
  );
  if (!holdRows.length) {
    await conn.execute("UPDATE copy SET status='available' WHERE copy_id=?", [copyId]);
    return null;
  }

  const holdId = holdRows[0].hold_id;
  const holdUserId = holdRows[0].user_id;
  const queuePosition = holdRows[0].queue_position;
  const availableSince = new Date();
  const expiresAt = new Date(availableSince.getTime() + HOLD_PICKUP_WINDOW_HOURS * 60 * 60 * 1000);

  await conn.execute(
    `
      UPDATE hold
      SET status='ready',
          copy_id=?,
          available_since=?,
          expires_at=?
      WHERE hold_id=?
    `,
    [copyId, availableSince, expiresAt, holdId]
  );
  await conn.execute("UPDATE copy SET status='on_hold' WHERE copy_id=?", [copyId]);

  let itemTitle = null;
  try {
    const [itemRows] = await conn.query("SELECT title FROM item WHERE item_id = ? LIMIT 1", [itemId]);
    itemTitle = itemRows[0]?.title || null;
  } catch {}
  try {
    await createHoldReadyNotification(conn, {
      holdId,
      userId: holdUserId,
      itemId,
      copyId,
      itemTitle,
      availableSince,
      expiresAt,
      queuePosition,
    });
  } catch (err) {
    console.error("Failed to create hold notification:", err);
  }

  return holdId;
}

export function isStaffAuth(auth) {
  if (!auth) return false;
  if (auth.employee_id) return true;
  const role = normalizeRole(auth.role);
  return role === "staff" || role === "admin";
}
