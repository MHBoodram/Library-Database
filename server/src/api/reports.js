import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

// All reports require staff
export const overdue = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();
    const graceParam = (url.searchParams.get("grace") || "all").trim().toLowerCase(); // beyond | within | all
    const sortParam = (url.searchParams.get("sort") || "most").trim().toLowerCase();   // most | least

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

    const DEFAULT_GRACE_DAYS = 3; // not overdue until the 4th day after due

    // Build grace filter clause
    let graceWhere = "DATEDIFF(CURDATE(), l.due_date) >= 1"; // at least 1 day past due
    if (graceParam === 'within') {
      graceWhere += ` AND GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) <= COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS})`;
    } else if (graceParam === 'beyond') {
      graceWhere += ` AND GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) > COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS})`;
    }

    const orderClause = sortParam === 'least' ? 'days_overdue ASC' : 'days_overdue DESC';

    const sql = `
      SELECT
        u.user_id AS patron_id,
        u.first_name,
        u.last_name,
        i.title,
        CASE WHEN d.item_id IS NOT NULL THEN 'device'
             WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
             ELSE 'book' END AS media_type,
        l.due_date,
        COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS}) AS grace_days,
        GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) AS days_since_due,
        GREATEST(GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS}), 0) AS days_overdue,
        CASE WHEN GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) BETWEEN 1 AND COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS}) THEN 1 ELSE 0 END AS within_grace,
        CASE WHEN f.fine_id IS NOT NULL THEN f.amount_assessed END AS assessed_fine,
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(
              0,
              (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS}))
            ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
          ), 2
        ) AS dynamic_est_fine,
        COALESCE(
          f.amount_assessed,
          ROUND(
            LEAST(
              COALESCE(l.max_fine_snapshot, 99999),
              GREATEST(
                0,
                (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS}))
              ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
            ), 2
          )
        ) AS current_fine,
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(
              0,
              (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, ${DEFAULT_GRACE_DAYS}))
            ) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
          ), 2
        ) AS est_fine
      FROM loan l
      JOIN user u ON u.user_id = l.user_id
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      LEFT JOIN fine f
        ON f.loan_id = l.loan_id
       AND f.status NOT IN ('paid','waived')
       AND f.reason = 'overdue'
      WHERE l.status = 'active'
        AND ${graceWhere}
        AND l.due_date >= ?
        AND l.due_date <= ?
      ORDER BY ${orderClause}, l.due_date ASC
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
                    (GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) - COALESCE(l.grace_days_snapshot, 3))
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

// Public version of topItems for homepage featured books (no auth required)
export const topItemsPublic = () => async (req, res) => {
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
    console.error("topItemsPublic report failed:", err.message);
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

export const listTransactions = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    if (!auth) return;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();
    const typesParam = (url.searchParams.get("types") || "").trim(); // comma-separated normalized types
    const statusesParam = (url.searchParams.get("statuses") || "").trim(); // comma-separated normalized current statuses
    const staffParam = (url.searchParams.get("staff") || "").trim(); // staff id or name substring
    const qParam = (url.searchParams.get("q") || "").trim(); // free text: patron name/email, item title, loan id, copy id
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

    const conditions = [];
    const params = [];

    // date range
    conditions.push("t.date BETWEEN ? AND ?");
    params.push(startDate, endDate);

    // Normalize event type on the fly and filter by provided types if any
    // Mapping legacy/alternate names into: requested | approved | rejected | returned | other
    const eventTypeExpr = `CASE
      WHEN t.\`type\` IN ('requested','checkout_request') THEN 'requested'
      WHEN t.\`type\` IN ('approved','checkout_approved','checked_out') THEN 'approved'
      WHEN t.\`type\` IN ('rejected','checkout_rejected') THEN 'rejected'
      WHEN t.\`type\` IN ('returned','checkin','checked_in') THEN 'returned'
      ELSE LOWER(t.\`type\`)
    END`;

    let typeList = [];
    if (typesParam) {
      typeList = typesParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (typeList.length) {
        conditions.push(`${eventTypeExpr} IN (${typeList.map(() => '?').join(',')})`);
        params.push(...typeList);
      }
    }

    // Staff filter: by id or partial name
    if (staffParam) {
      const isNumeric = /^\d+$/.test(staffParam);
      if (isNumeric) {
        conditions.push("t.employee_id = ?");
        params.push(Number(staffParam));
      } else {
        conditions.push("(CONCAT(COALESCE(e.first_name,''),' ',COALESCE(e.last_name,'')) LIKE ?)");
        params.push(`%${staffParam}%`);
      }
    }

    // Free text search across patron name/email, title, loan id, copy id
    if (qParam) {
      const like = `%${qParam}%`;
      conditions.push("(u.email LIKE ? OR CONCAT(u.first_name,' ',u.last_name) LIKE ? OR i.title LIKE ? OR CAST(t.loan_id AS CHAR) LIKE ? OR CAST(t.copy_id AS CHAR) LIKE ?)");
      params.push(like, like, like, like, like);
    }

    // Build current status per loan using latest transaction (no date limit)
    const latestStatusJoin = `
      LEFT JOIN (
        SELECT t2.loan_id,
               CASE
                 WHEN t2.\`type\` IN ('requested','checkout_request') THEN 'Pending'
                 WHEN t2.\`type\` IN ('approved','checkout_approved','checked_out') THEN 'Approved & Active'
                 WHEN t2.\`type\` IN ('rejected','checkout_rejected') THEN 'Rejected'
                 WHEN t2.\`type\` IN ('returned','checkin','checked_in') THEN 'Returned'
                 ELSE '—'
               END AS current_status
        FROM \`transaction\` t2
        JOIN (
          SELECT loan_id, MAX(\`date\`) AS max_date
          FROM \`transaction\`
          WHERE loan_id IS NOT NULL
          GROUP BY loan_id
        ) last ON last.loan_id = t2.loan_id AND t2.\`date\` = last.max_date
      ) ls ON ls.loan_id = t.loan_id
    `;

    // Status filter (based on derived latest status)
    let statusList = [];
    if (statusesParam) {
      statusList = statusesParam.split(',').map(s => s.trim()).filter(Boolean);
      if (statusList.length) {
        conditions.push("(ls.current_status IS NOT NULL AND ls.current_status IN (" + statusList.map(()=>'?').join(',') + "))");
        params.push(...statusList);
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT
        t.transaction_id,
        t.loan_id,
        t.copy_id,
        ${eventTypeExpr} AS event_type,
        t.\`date\`      AS event_timestamp,
        t.\`type\`      AS raw_type,
        u.user_id,
        u.email        AS user_email,
        u.first_name   AS user_first_name,
        u.last_name    AS user_last_name,
        e.employee_id,
        e.first_name   AS employee_first_name,
        e.last_name    AS employee_last_name,
        i.title        AS item_title,
        ls.current_status
      FROM \`transaction\` t
      JOIN user u     ON u.user_id = t.user_id
      JOIN copy c     ON c.copy_id = t.copy_id
      JOIN item i     ON i.item_id = c.item_id
      LEFT JOIN employee e ON e.employee_id = t.employee_id
      ${latestStatusJoin}
      ${whereClause}
      ORDER BY t.\`date\` DESC, t.transaction_id DESC
      LIMIT 500
    `;
    try {
      const [rows] = await pool.query(sql, params);
      return sendJSON(res, 200, rows);
    } catch (e) {
      console.error('transactions main query failed, falling back:', e.message);
      // Fallback to simpler shape if some schemas differ
      const fbSql = `
        SELECT
          t.transaction_id,
          t.loan_id,
          t.copy_id,
          CASE
            WHEN t.\`type\` IN ('requested','checkout_request') THEN 'requested'
            WHEN t.\`type\` IN ('approved','checkout_approved','checked_out') THEN 'approved'
            WHEN t.\`type\` IN ('rejected','checkout_rejected') THEN 'rejected'
            WHEN t.\`type\` IN ('returned','checkin','checked_in') THEN 'returned'
            ELSE LOWER(t.\`type\`)
          END AS event_type,
          t.\`date\` AS event_timestamp,
          t.\`type\` AS raw_type,
          u.user_id,
          u.email        AS user_email,
          u.first_name   AS user_first_name,
          u.last_name    AS user_last_name,
          e.employee_id,
          e.first_name   AS employee_first_name,
          e.last_name    AS employee_last_name,
          i.title        AS item_title,
          NULL AS current_status
        FROM \`transaction\` t
        JOIN user u     ON u.user_id = t.user_id
        JOIN copy c     ON c.copy_id = t.copy_id
        JOIN item i     ON i.item_id = c.item_id
        LEFT JOIN employee e ON e.employee_id = t.employee_id
        ${whereClause}
        ORDER BY t.\`date\` DESC, t.transaction_id DESC
        LIMIT 500
      `;
      try {
        const [rows] = await pool.query(fbSql, params);
        return sendJSON(res, 200, rows);
      } catch (e2) {
        console.error('transactions fallback (transaction table) failed, trying loans-only:', e2.message);
        // Loans-only fallback (approved/returned) using known columns
        const loansSql = `
          SELECT
            CONCAT('loan-', l.loan_id, '-approved')    AS transaction_id,
            l.loan_id,
            l.copy_id,
            'approved'                                 AS event_type,
            l.checkout_date                            AS event_timestamp,
            'approved'                                 AS raw_type,
            u.user_id,
            u.email                                    AS user_email,
            u.first_name                               AS user_first_name,
            u.last_name                                AS user_last_name,
            NULL                                       AS employee_id,
            NULL                                       AS employee_first_name,
            NULL                                       AS employee_last_name,
            i.title                                    AS item_title,
            'Approved & Active'                        AS current_status
          FROM loan l
          JOIN user u ON u.user_id = l.user_id
          JOIN copy c ON c.copy_id = l.copy_id
          JOIN item i ON i.item_id = c.item_id
          WHERE l.checkout_date IS NOT NULL AND l.checkout_date BETWEEN ? AND ?
          UNION ALL
          SELECT
            CONCAT('loan-', l.loan_id, '-returned')    AS transaction_id,
            l.loan_id,
            l.copy_id,
            'returned'                                 AS event_type,
            l.return_date                              AS event_timestamp,
            'returned'                                 AS raw_type,
            u.user_id,
            u.email                                    AS user_email,
            u.first_name                               AS user_first_name,
            u.last_name                                AS user_last_name,
            NULL                                       AS employee_id,
            NULL                                       AS employee_first_name,
            NULL                                       AS employee_last_name,
            i.title                                    AS item_title,
            'Returned'                                 AS current_status
          FROM loan l
          JOIN user u ON u.user_id = l.user_id
          JOIN copy c ON c.copy_id = l.copy_id
          JOIN item i ON i.item_id = c.item_id
          WHERE l.return_date IS NOT NULL AND l.return_date BETWEEN ? AND ?
          ORDER BY event_timestamp DESC
          LIMIT 500
        `;
        const [rows] = await pool.query(loansSql, [startDate, endDate, startDate, endDate]);
        return sendJSON(res, 200, rows);
      }
    }
  }catch (err) {
    console.error("Failed to load transactions:", err.message);
    return sendJSON(res, 500, { error: "transactions_query_failed" });
  }
};
