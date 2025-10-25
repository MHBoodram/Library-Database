import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const placeHold = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = Number(b.user_id || auth.user_id);
  const item_id = Number(b.item_id) || null;
  const copy_id = Number(b.copy_id) || null;
  if (!user_id || (!item_id && !copy_id) || (item_id && copy_id))
    return sendJSON(res, 400, { error:"invalid_payload" });

  const [r] = await pool.execute(
    "INSERT INTO hold(user_id,item_id,copy_id,hold_date,status) VALUES(?,?,?,?, 'active')",
    [user_id, item_id, copy_id, new Date()]
  );
  return sendJSON(res, 201, { hold_id: r.insertId });
};

export const cancelHold = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const hold_id = Number(params.id);
  await pool.execute("UPDATE hold SET status='cancelled' WHERE hold_id=?", [hold_id]);
  return sendJSON(res, 200, { ok:true });
};
