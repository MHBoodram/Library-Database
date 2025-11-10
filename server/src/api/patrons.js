import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

const SEARCH_LIMIT = 25;

export const searchPatrons = (JWT_SECRET) => async (req, res) => {
  const staff = requireRole(req, res, JWT_SECRET, "staff");
  if (!staff) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const raw = (url.searchParams.get("q") || "").trim();

  if (!raw) {
    return sendJSON(res, 200, []);
  }

  const where = [];
  const params = [];
  const numeric = Number(raw);

  if (Number.isInteger(numeric)) {
    where.push("u.user_id = ?");
    params.push(numeric);
  } else {
    where.push("(u.first_name LIKE ? OR u.last_name LIKE ? OR a.email LIKE ?)");
    params.push(`%${raw}%`, `%${raw}%`, `%${raw}%`);
  }

  const sql = `
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      a.account_id,
      a.role,
      a.is_active,
      a.flagged_for_deletion,
      a.flagged_at
    FROM user u
    LEFT JOIN account a ON a.user_id = u.user_id
    WHERE (${where.join(" OR ")})
      AND (a.role IS NULL OR a.role IN ('student','faculty'))
    ORDER BY u.first_name, u.last_name
    LIMIT ?
  `;

  try {
    const [rows] = await pool.query(sql, [...params, SEARCH_LIMIT]);
    const out = rows.map((row) => ({
      user_id: row.user_id,
      account_id: row.account_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      role: row.role || "student",
      is_active: Boolean(row.is_active ?? 1),
      flagged_for_deletion: Boolean(row.flagged_for_deletion),
      flagged_at: row.flagged_at,
    }));
    return sendJSON(res, 200, out);
  } catch (err) {
    console.error("patron search failed:", err.message);
    return sendJSON(res, 500, { error: "patron_search_failed" });
  }
};
