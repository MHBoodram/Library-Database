import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const createCopy = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const item_id = Number(b.item_id);
  let barcode = (b.barcode||"").trim();
  if (!item_id) return sendJSON(res, 400, { error: "invalid_payload", message: "item_id is required" });

  // If barcode not provided, auto-generate a unique one to reduce friction
  const generateBarcode = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(100 + Math.random()*900);
    return `BC-${ts}-${rand}`;
  };
  if (!barcode) barcode = generateBarcode();

  try {
    let attempts = 0;
    while (true) {
      try {
        const [r] = await pool.execute(
          "INSERT INTO copy(item_id, barcode, status, shelf_location, acquired_at) VALUES(?,?,?,?,CURDATE())",
          [item_id, barcode, b.status||'available', (b.shelf_location||'').trim() || null]
        );
        return sendJSON(res, 201, { copy_id: r.insertId, barcode });
      } catch (err) {
        if (err && err.code === "ER_DUP_ENTRY") {
          // regenerate a barcode and retry a couple of times
          attempts += 1;
          if (attempts >= 3 || (b.barcode||"").trim()) {
            return sendJSON(res, 409, { error: "barcode_in_use", message: "Barcode already in use." });
          }
          barcode = generateBarcode();
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    console.error("Create copy failed:", err?.message || err);
    return sendJSON(res, 500, { error: "copy_create_failed" });
  }
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
