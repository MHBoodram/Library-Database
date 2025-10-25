import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const createItem = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const title = (b.title||"").trim();
  if (!title) return sendJSON(res, 400, { error:"title_required" });
  const [r] = await pool.execute(
    "INSERT INTO item(title, subject, classification) VALUES(?,?,?)",
    [title, b.subject||null, b.classification||null]
  );
  return sendJSON(res, 201, { item_id: r.insertId });
};

export const updateItem = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  await pool.execute(
    "UPDATE item SET title=COALESCE(?,title), subject=COALESCE(?,subject), classification=COALESCE(?,classification) WHERE item_id=?",
    [b.title||null, b.subject||null, b.classification||null, Number(params.id)]
  );
  return sendJSON(res, 200, { ok:true });
};

export const deleteItem = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  await pool.execute("DELETE FROM item WHERE item_id=?", [Number(params.id)]);
  return sendJSON(res, 200, { ok:true });
};
