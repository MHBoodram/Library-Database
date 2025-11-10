import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

// All reports require staff
export const overdue = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();

    // Validate date parameters (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let startDate = startDateParam;
    let endDate = endDateParam;

    // Default to last 30 days if dates not provided or invalid
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      startDate = monthAgo.toISOString().slice(0, 10);
    }

    // Ensure start is before end
    if (new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

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
        -- existing assessed fine on an open overdue fine, if any
        CASE WHEN f.fine_id IS NOT NULL THEN f.amount_assessed END AS assessed_fine,
        -- dynamic estimate as of now using loan snapshots
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(
              0,
              (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, 0))
            ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
          ), 2
        ) AS dynamic_est_fine,
        -- prefer the assessed fine if present, otherwise the dynamic estimate
        COALESCE(
          f.amount_assessed,
          ROUND(
            LEAST(
              COALESCE(l.max_fine_snapshot, 99999),
              GREATEST(
                0,
                (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, 0))
              ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
            ), 2
          )
        ) AS current_fine,
        -- keep original alias for backward compatibility
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(
              0,
              (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, 0))
            ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
          ), 2
        ) AS est_fine
      FROM loan l
      JOIN user u ON u.user_id = l.user_id
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      -- join latest open overdue fine for this loan (if exists)
      LEFT JOIN fine f
        ON f.loan_id = l.loan_id
       AND f.status NOT IN ('paid','waived')
       AND f.reason = 'overdue'
      WHERE l.status = 'active' 
        AND l.due_date < CURDATE()
        AND l.due_date >= ?
        AND l.due_date <= ?
      ORDER BY days_overdue DESC, l.due_date ASC
      LIMIT 500
    `;
    const [rows] = await pool.query(sql, [startDate, endDate]);
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("overdue report failed:", err.message);
    return sendJSON(res, 500, { error: "report_overdue_failed" });
  }
};

export const balances = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();

    // Validate date parameters (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let startDate = startDateParam;
    let endDate = endDateParam;

    // Default to all time if dates not provided or invalid
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      startDate = yearAgo.toISOString().slice(0, 10);
    }

    // Ensure start is before end
    if (new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const sql = `
      SELECT
        u.first_name,
        u.last_name,
        SUM(CASE WHEN LOWER(f.status) IN ('paid','waived') THEN f.amount_assessed ELSE 0 END) AS paid_total,
        SUM(CASE WHEN LOWER(f.status) NOT IN ('paid','waived') THEN f.amount_assessed ELSE 0 END) AS open_balance,
        -- open balance recalculated with current dynamic formula for overdue fines
        SUM(
          CASE 
            WHEN LOWER(f.status) NOT IN ('paid','waived') AND f.reason = 'overdue' THEN
              ROUND(
                LEAST(
                  COALESCE(l.max_fine_snapshot, 99999),
                  GREATEST(
                    0,
                    (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, 0))
                  ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
                ), 2
              )
            WHEN LOWER(f.status) NOT IN ('paid','waived') THEN f.amount_assessed
            ELSE 0
          END
        ) AS open_balance_current
      FROM fine f
      JOIN loan l ON l.loan_id = f.loan_id
      JOIN user u ON u.user_id = l.user_id
      WHERE f.assessed_at >= ? AND f.assessed_at <= ?
      GROUP BY u.user_id
      ORDER BY open_balance_current DESC, paid_total DESC
      LIMIT 500
    `;
    const [rows] = await pool.query(sql, [startDate, endDate]);
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("balances report failed:", err.message);
    return sendJSON(res, 500, { error: "report_balances_failed" });
  }
};

export const topItems = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();

    // Validate date parameters (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let startDate = startDateParam;
    let endDate = endDateParam;

    // Default to last 30 days if dates not provided or invalid
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      startDate = monthAgo.toISOString().slice(0, 10);
    }

    // Ensure start is before end
    if (new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const sql = `
      SELECT
        i.title,
        CASE WHEN d.item_id IS NOT NULL THEN 'device'
             WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
             ELSE 'book' END AS media_type,
        COUNT(*) AS loans_count
      FROM loan l
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE l.checkout_date >= ? AND l.checkout_date <= ?
      GROUP BY i.item_id
      ORDER BY loans_count DESC, i.title ASC
      LIMIT 50
    `;
    const [rows] = await pool.query(sql, [startDate, endDate]);
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("topItems report failed:", err.message);
    return sendJSON(res, 500, { error: "report_top_items_failed" });
  }
};

// New Patrons by Month report
// Returns the number of newly joined patrons (students + faculty) grouped by month for a custom date range
export const newPatronsByMonth = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();

    // Validate date parameters (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let startDate = startDateParam;
    let endDate = endDateParam;

    // Default to last 12 months if dates not provided or invalid
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      startDate = yearAgo.toISOString().slice(0, 10);
    }

    // Ensure start is before end
    if (new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const sql = `
      SELECT
        DATE_FORMAT(u.joined_at, '%Y-%m') AS ym,
        COUNT(DISTINCT u.user_id) AS new_patrons
      FROM user u
      LEFT JOIN account a ON a.user_id = u.user_id
      WHERE u.joined_at IS NOT NULL
        AND u.joined_at >= ?
        AND u.joined_at <= ?
        AND (
          a.role IS NULL OR a.role IN ('student','faculty')
        )
      GROUP BY ym
      ORDER BY ym ASC
    `;

    const [rows] = await pool.query(sql, [startDate, endDate]);

    // Fill in any missing months in the range with zero counts
    const start = new Date(startDate);
    const end = new Date(endDate);
    const buckets = new Map(rows.map(r => [r.ym, Number(r.new_patrons)]));
    const out = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      const ym = current.toISOString().slice(0, 7); // YYYY-MM
      out.push({ month: ym, new_patrons: buckets.get(ym) || 0 });
      current.setMonth(current.getMonth() + 1);
    }

    return sendJSON(res, 200, out);
  } catch (err) {
    console.error("newPatronsByMonth report failed:", err.message);
    return sendJSON(res, 500, { error: "report_new_patrons_failed" });
  }
};
