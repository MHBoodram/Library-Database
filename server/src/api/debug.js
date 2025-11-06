import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

// Staff-only lightweight diagnostics to inspect schema differences in production.
// DO NOT expose data rows; only structure. Safe to keep temporarily.
export const schemaInfo = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const tables = ["loan", "copy", "user"];
    const out = {};
    for (const t of tables) {
      try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM ${t}`);
        out[t] = cols.map(c => ({ field: c.Field, type: c.Type, null: c.Null, key: c.Key }));
      } catch (e) {
        out[t] = { error: e.message };
      }
    }
    return sendJSON(res, 200, { ok: true, schema: out });
  } catch (err) {
    return sendJSON(res, 500, { error: "schema_inspect_failed", message: err.message });
  }
};