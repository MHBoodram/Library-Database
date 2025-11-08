import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

// All reports require staff
export const overdue = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const sql = `
      SELECT
        u.first_name,
        u.last_name,
        i.title,
        -- best-effort media type
        CASE WHEN d.item_id IS NOT NULL THEN 'device'
             WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
             ELSE 'book' END AS media_type,
        l.due_date,
        GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) AS days_overdue,
        -- estimate fine using snapshots when available
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(
              0,
              (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, 0))
            ) * COALESCE(l.daily_fine_rate_snapshot, 0)
          ), 2
        ) AS est_fine
      FROM loan l
      JOIN user u ON u.user_id = l.user_id
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE l.status = 'active' AND l.due_date < CURDATE()
      ORDER BY days_overdue DESC, l.due_date ASC
      LIMIT 500
    `;
    const [rows] = await pool.query(sql);
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("overdue report failed:", err.message);
    return sendJSON(res, 500, { error: "report_overdue_failed" });
  }
};

export const balances = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const sql = `
      SELECT
        u.first_name,
        u.last_name,
        SUM(CASE WHEN LOWER(f.status) IN ('paid','waived') THEN f.amount_assessed ELSE 0 END) AS paid_total,
        SUM(CASE WHEN LOWER(f.status) NOT IN ('paid','waived') THEN f.amount_assessed ELSE 0 END) AS open_balance
      FROM fine f
      JOIN loan l ON l.loan_id = f.loan_id
      JOIN user u ON u.user_id = l.user_id
      GROUP BY u.user_id
      ORDER BY open_balance DESC, paid_total DESC
      LIMIT 500
    `;
    const [rows] = await pool.query(sql);
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("balances report failed:", err.message);
    return sendJSON(res, 500, { error: "report_balances_failed" });
  }
};

export const topItems = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const sql = `
      SELECT
        i.title,
        CASE WHEN d.item_id IS NOT NULL THEN 'device'
             WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
             ELSE 'book' END AS media_type,
        COUNT(*) AS loans_30d
      FROM loan l
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE l.checkout_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY i.item_id
      ORDER BY loans_30d DESC, i.title ASC
      LIMIT 50
    `;
    const [rows] = await pool.query(sql);
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("topItems report failed:", err.message);
    return sendJSON(res, 500, { error: "report_top_items_failed" });
  }
};

// New Patrons by Month report
// Returns the number of newly joined patrons (students + faculty) per month for the last 12 months (including current)
export const newPatronsByMonth = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    // Determine optional window size (months) param, default 12
    const url = new URL(req.url, `http://${req.headers.host}`);
    const monthParam = (url.searchParams.get("month") || "").trim(); // format YYYY-MM
    const monthsParam = Number(url.searchParams.get("months"));
    const monthsWindow = Number.isInteger(monthsParam) && monthsParam > 0 && monthsParam <= 36 ? monthsParam : 12;

    // If a specific month is requested (YYYY-MM), return just that month's count
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
      const startYm = monthParam + "-01"; // first day of month
      const sqlOne = `
        SELECT COUNT(DISTINCT u.user_id) AS new_patrons
        FROM user u
        LEFT JOIN account a ON a.user_id = u.user_id
        WHERE u.joined_at IS NOT NULL
          AND u.joined_at >= ?
          AND u.joined_at < DATE_ADD(?, INTERVAL 1 MONTH)
          AND (a.role IS NULL OR a.role IN ('student','faculty'))
      `;
      const [one] = await pool.query(sqlOne, [startYm, startYm]);
      const count = Number(one?.[0]?.new_patrons || 0);
      return sendJSON(res, 200, [{ month: monthParam, new_patrons: count }]);
    }

    // We count users whose joined_at date falls inside each month bucket (range mode).
    // Exclude staff/admin accounts by filtering through account.role if it exists; fallback to joined_at only.
    // Some schemas store role in account; we approximate patrons as users who have an account role of student or faculty.
    const sql = `
      SELECT
        DATE_FORMAT(u.joined_at, '%Y-%m') AS ym,
        COUNT(DISTINCT u.user_id) AS new_patrons
      FROM user u
      LEFT JOIN account a ON a.user_id = u.user_id
      WHERE u.joined_at IS NOT NULL
        AND u.joined_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        AND (
          a.role IS NULL OR a.role IN ('student','faculty')
        )
      GROUP BY ym
      ORDER BY ym DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(sql, [monthsWindow, monthsWindow]);

    // Normalize to ensure we return a list covering each month even if zero (fill gaps)
    const now = new Date();
    const buckets = new Map(rows.map(r => [r.ym, Number(r.new_patrons)]));
    const out = [];
    for (let i = 0; i < monthsWindow; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = dt.toISOString().slice(0,7); // YYYY-MM
      out.push({ month: ym, new_patrons: buckets.get(ym) || 0 });
    }
    // Order ascending by month for chart friendliness
    out.reverse();

    return sendJSON(res, 200, out);
  } catch (err) {
    console.error("newPatronsByMonth report failed:", err.message);
    return sendJSON(res, 500, { error: "report_new_patrons_failed" });
  }
};
