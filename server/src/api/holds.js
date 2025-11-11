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

export const cancelHold = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const hold_id = Number(params.id);
  await pool.execute("UPDATE hold SET status='cancelled' WHERE hold_id=?", [hold_id]);
  return sendJSON(res, 200, { ok:true });
};
