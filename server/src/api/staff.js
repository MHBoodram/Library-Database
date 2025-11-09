import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

const ACTIVE_STATUSES = ["paid", "waived"]; // treated as inactive if matched

export const listActiveLoans = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff");
  if (!auth) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const conditions = ["l.status = 'active'"];
  const params = [];

  if (q) {
    const like = `%${q}%`;
    conditions.push(
      `(
        LOWER(u.email) LIKE ?
        OR LOWER(u.first_name) LIKE ?
        OR LOWER(u.last_name) LIKE ?
        OR LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
        OR LOWER(i.title) LIKE ?
        OR LOWER(CONCAT(e.first_name, ' ', e.last_name)) LIKE ?
      )`
    );
    params.push(like, like, like, like, like, like);

    const numeric = Number(q);
    if (Number.isInteger(numeric)) {
      conditions.push("(l.loan_id = ? OR c.copy_id = ?)");
      params.push(numeric, numeric);
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      l.loan_id,
      l.due_date,
      l.status,
      u.user_id,
      u.email        AS user_email,
      u.first_name   AS user_first_name,
      u.last_name    AS user_last_name,
      e.first_name   AS employee_first_name,
      e.last_name    AS employee_last_name,
      c.copy_id,
      i.title        AS item_title
    FROM loan l
    JOIN user u     ON u.user_id = l.user_id
    JOIN copy c     ON c.copy_id = l.copy_id
    JOIN item i     ON i.item_id = c.item_id
    LEFT JOIN employee e ON e.employee_id = l.employee_id
    ${whereClause}
    ORDER BY l.due_date ASC, l.loan_id ASC
    LIMIT 500
  `;

  try {
    const [rows] = await pool.query(sql, params);
    return sendJSON(res, 200, { rows });
  } catch (err) {
    console.error("Failed to load active loans:", err.message);
    return sendJSON(res, 500, { error: "active_loans_query_failed" });
  }
};

export const listFines = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff");
  if (!auth) return;

  // Auto-create fines for overdue loans that don't have one yet
  try {
    await pool.query(`
      INSERT INTO fine (loan_id, user_id, assessed_at, reason, amount_assessed, status)
      SELECT 
        l.loan_id,
        l.user_id,
        NOW(),
        'overdue',
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(
              0,
              (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, 0))
            ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
          ), 2
        ),
        'open'
      FROM loan l
      WHERE l.status = 'active' 
        AND l.due_date < CURDATE()
        AND NOT EXISTS (
          SELECT 1 FROM fine f 
          WHERE f.loan_id = l.loan_id 
            AND f.status NOT IN ('paid', 'waived')
        )
    `);
  } catch (err) {
    console.error("Failed to auto-create overdue fines:", err.message);
    // Continue anyway - we'll still show existing fines
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const q = (url.searchParams.get("q") || "").trim();
  const statusParam = (url.searchParams.get("status") || "").trim().toLowerCase();

  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize") || url.searchParams.get("limit") || 50);
  const pageSize = Math.min(Math.max(pageSizeRaw || 50, 1), 200);
  const offset = (page - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (!statusParam || statusParam === "active") {
    // Filter to active fines only (not paid or waived)
    conditions.push(`f.status NOT IN ('paid', 'waived')`);
  } else if (statusParam !== "all") {
    conditions.push("LOWER(f.status) = ?");
    params.push(statusParam);
  }

  // Only show fines where loan is overdue OR fine is for non-overdue reasons (damage, lost, manual)
  conditions.push(`(l.due_date < CURDATE() OR f.reason IN ('damage', 'lost', 'manual'))`);

  if (q) {
    const like = `%${q.toLowerCase()}%`;
    const searchParts = [
      "LOWER(u.first_name) LIKE ?",
      "LOWER(u.last_name) LIKE ?",
      "LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE ?",
      "LOWER(i.title) LIKE ?",
    ];
    const searchParams = [like, like, like, like];

    const numeric = Number(q);
    if (Number.isInteger(numeric)) {
      searchParts.push("f.fine_id = ?");
      searchParams.push(numeric);
      searchParts.push("l.loan_id = ?");
      searchParams.push(numeric);
    }

    conditions.push(`(${searchParts.join(" OR ")})`);
    params.push(...searchParams);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Query all fines with days overdue calculation
  const finesSql = `
    SELECT
      u.first_name,
      u.last_name,
      f.fine_id,
      f.status,
      f.amount_assessed,
      COALESCE(
        (SELECT SUM(fp.amount) FROM fine_payment fp WHERE fp.fine_id = f.fine_id),
        0
      ) AS amount_paid,
      l.loan_id,
      l.due_date,
      i.title,
      GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) AS days_overdue
    FROM fine f
    JOIN loan l ON l.loan_id = f.loan_id
    JOIN user u ON u.user_id = l.user_id
    JOIN copy c ON c.copy_id = l.copy_id
    JOIN item i ON i.item_id = c.item_id
    ${whereClause}
    ORDER BY l.due_date DESC, f.fine_id DESC
    LIMIT ?
    OFFSET ?
  `;

  try {
    const [rows] = await pool.query(finesSql, [...params, pageSize, offset]);
    return sendJSON(res, 200, { rows, page, pageSize, query: q, status: statusParam || "active" });
  } catch (err) {
    console.error("Failed to load staff fines:", err.message);
    return sendJSON(res, 500, { error: "fines_query_failed" });
  }
};
