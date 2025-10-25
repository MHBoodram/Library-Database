//I dont even know why this exists. Might get deleted

import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

// All reports require staff
export const overdue = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  const [rows] = await pool.query("SELECT * FROM v_overdue_loans");
  return sendJSON(res, 200, rows);
};

export const balances = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  const [rows] = await pool.query("SELECT * FROM v_user_balances");
  return sendJSON(res, 200, rows);
};

export const topItems = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  const [rows] = await pool.query("SELECT * FROM v_top_items_30d");
  return sendJSON(res, 200, rows);
};
