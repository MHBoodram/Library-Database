import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const createCopy = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const item_id = Number(b.item_id);
  const barcode = (b.barcode||"").trim();
  if (!item_id || !barcode) return sendJSON(res, 400, { error: "invalid_payload" });

  const [r] = await pool.execute(
    "INSERT INTO copy(item_id, barcode, status, shelf_location, acquired_at) VALUES(?,?,?,?,CURDATE())",
    [item_id, barcode, b.status||'available', b.shelf_location||null]
  );
  return sendJSON(res, 201, { copy_id: r.insertId });
};

export const updateCopy = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const copy_id = Number(params.id);
  const b = await readJSONBody(req);
  await pool.execute(
    "UPDATE copy SET status=COALESCE(?,status), shelf_location=COALESCE(?,shelf_location) WHERE copy_id=?",
    [b.status||null, b.shelf_location||null, copy_id]
  );
  return sendJSON(res, 200, { ok:true });
};

export const deleteCopy = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const copy_id = Number(params.id);
  await pool.execute("UPDATE copy SET status='lost' WHERE copy_id=?", [copy_id]);
  return sendJSON(res, 200, { ok:true });
};
