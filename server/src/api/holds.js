import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

function resolveUserId(auth, override) {
  return Number(
    override ||
    auth?.uid ||
    auth?.user_id ||
    auth?.userId
  );
}

export const placeHold = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = resolveUserId(auth, b.user_id);
  let item_id = Number(b.item_id) || null;
  const copy_id = Number(b.copy_id) || null;
  if (!user_id || (!item_id && !copy_id) || (item_id && copy_id))
    return sendJSON(res, 400, { error:"invalid_payload", message: "Provide either item_id or copy_id." });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (!item_id && copy_id) {
      const [rows] = await conn.query("SELECT item_id FROM copy WHERE copy_id = ?", [copy_id]);
      if (!rows.length) {
        throw new Error("copy_not_found");
      }
      item_id = Number(rows[0].item_id);
    }

    const [[posRow]] = await conn.query(
      "SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position FROM hold WHERE item_id = ?",
      [item_id]
    );
    const queue_position = Number(posRow?.next_position || 1);

    const [r] = await conn.execute(
      "INSERT INTO hold(user_id,item_id,copy_id,status,queue_position,available_since,expires_at) VALUES(?,?,?,?,?,NULL,NULL)",
      [user_id, item_id, copy_id || null, "queued", queue_position]
    );

    await conn.commit();
    return sendJSON(res, 201, { hold_id: r.insertId, queue_position });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to place hold:", err);
    if (err.message === "copy_not_found") {
      return sendJSON(res, 404, { error: "copy_not_found" });
    }
    return sendJSON(res, 500, { error: "server_error", message: err.message });
  } finally {
    conn.release();
  }
};

export const cancelHold = (JWT_SECRET, { restrictToSelf = true } = {}) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const hold_id = Number(params.id);
  if (!hold_id) return sendJSON(res, 400, { error: "invalid_hold" });
  const targetUser = restrictToSelf ? resolveUserId(auth) : null;
  const sql = restrictToSelf
    ? "UPDATE hold SET status='cancelled' WHERE hold_id=? AND user_id=? AND status IN ('queued','ready')"
    : "UPDATE hold SET status='cancelled' WHERE hold_id=? AND status IN ('queued','ready')";
  const paramsArr = restrictToSelf ? [hold_id, targetUser] : [hold_id];
  try {
    const [result] = await pool.execute(sql, paramsArr);
    if (result.affectedRows === 0) {
      return sendJSON(res, 404, { error: "hold_not_found" });
    }
    return sendJSON(res, 200, { ok:true });
  } catch (err) {
    console.error("cancelHold error", err);
    return sendJSON(res, 500, { error: "cancel_hold_failed" });
  }
};

export const listHolds = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  const queryScope = (req.url || "").includes("/api/staff/holds") ? "staff" : "self";
  if (queryScope === "staff") {
    const isStaff = Boolean(auth.employee_id);
    const role = (auth.role || "").toLowerCase();
    if (!isStaff && role !== "staff" && role !== "admin") {
      return sendJSON(res, 403, { error: "forbidden" });
    }
  }
  const filterUserId = queryScope === "self" ? resolveUserId(auth) : null;

  try {
    const [rows] = await pool.query(
      `
        SELECT
          h.hold_id,
          h.status,
          h.queue_position,
          h.available_since,
          h.expires_at,
          h.created_at,
          h.item_id,
          i.title AS item_title,
          h.user_id,
          u.first_name,
          u.last_name,
          u.email,
          h.copy_id,
          c.barcode AS copy_barcode
        FROM hold h
        JOIN item i ON i.item_id = h.item_id
        JOIN user u ON u.user_id = h.user_id
        LEFT JOIN copy c ON c.copy_id = h.copy_id
        ${filterUserId ? "WHERE h.user_id = ?" : ""}
        ORDER BY FIELD(h.status,'ready','queued','fulfilled','cancelled','expired'),
                 h.queue_position ASC,
                 h.created_at ASC
      `
      , filterUserId ? [filterUserId] : []
    );
    return sendJSON(res, 200, { rows });
  } catch (err) {
    console.error("Failed to list holds:", err);
    return sendJSON(res, 500, { error: "holds_query_failed" });
  }
};
