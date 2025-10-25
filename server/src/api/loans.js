import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const checkout = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = Number(b.user_id || auth.user_id);
  const copy_id = Number(b.copy_id);
  const employee_id = Number(b.employee_id) || null;
  if (!user_id || !copy_id) return sendJSON(res, 400, { error:"invalid_payload" });

  try {
    await pool.query("CALL sp_checkout(?,?,?)", [user_id, copy_id, employee_id]);
    return sendJSON(res, 201, { ok:true });
  } catch (e) {
    return sendJSON(res, 400, { error: e.message });
  }
};

export const returnLoan = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const loan_id = Number(b.loan_id);
  const employee_id = Number(b.employee_id) || null;
  if (!loan_id) return sendJSON(res, 400, { error:"invalid_payload" });

  await pool.query("CALL sp_return(?,?)", [loan_id, employee_id]);
  return sendJSON(res, 200, { ok:true });
};
