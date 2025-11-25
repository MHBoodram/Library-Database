import { sendJSON, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEFRAMES = new Set(["day", "week", "month", "quarter", "year"]);
const LOST_FLAT_FEE = Number(process.env.LOST_REPLACEMENT_FEE || 80);

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const parts = String(value).split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfBucket(date, timeframe) {
  const d = new Date(date.getTime());
  switch (timeframe) {
    case "day":
      return d;
    case "week": {
      const weekday = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1; // Monday start
      d.setUTCDate(d.getUTCDate() - weekday);
      return d;
    }
    case "quarter": {
      const quarterStart = Math.floor(d.getUTCMonth() / 3) * 3;
      d.setUTCMonth(quarterStart, 1);
      return d;
    }
    case "year":
      d.setUTCMonth(0, 1);
      return d;
    case "month":
    default:
      d.setUTCDate(1);
      return d;
  }
}

function advanceBucket(date, timeframe) {
  const d = new Date(date.getTime());
  switch (timeframe) {
    case "day":
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case "week":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "quarter":
      d.setUTCMonth(d.getUTCMonth() + 3, 1);
      break;
    case "year":
      d.setUTCFullYear(d.getUTCFullYear() + 1, 0, 1);
      break;
    case "month":
    default:
      d.setUTCMonth(d.getUTCMonth() + 1, 1);
      break;
  }
  return d;
}

function bucketEnd(date, timeframe) {
  const next = advanceBucket(date, timeframe);
  const end = new Date(next.getTime() - DAY_MS);
  return end;
}

function bucketLabel(date, timeframe) {
  const year = date.getUTCFullYear();
  const month = MONTH_LABELS[date.getUTCMonth()];
  switch (timeframe) {
    case "day":
      return `${month} ${date.getUTCDate()}, ${year}`;
    case "week":
      return `Week of ${month} ${date.getUTCDate()}`;
    case "quarter": {
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
      return `Q${quarter} ${year}`;
    }
    case "year":
      return `${year}`;
    case "month":
    default:
      return `${month} ${year}`;
  }
}

function parseListParam(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeUserType(role, isFaculty) {
  const normalizedRole = (role || "").toLowerCase();
  if (normalizedRole === "faculty") return "faculty";
  if (normalizedRole === "staff" || normalizedRole === "admin") return "staff";
  if (normalizedRole === "community") return "community";
  if (normalizedRole === "student") return isFaculty ? "faculty" : "student";
  return isFaculty ? "faculty" : "student";
}

function percentDiff(current, previous) {
  if (previous === null || previous === undefined) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

// All reports require staff
export const overdue = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    // Ensure overdue loans without fines get one before reporting (no grace period)
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
              GREATEST(0, DATEDIFF(CURDATE(), l.due_date)) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
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
          AND NOT EXISTS (
            SELECT 1 FROM fine f2
            WHERE f2.loan_id = l.loan_id
              AND f2.reason = 'lost'
          )
      `);
    } catch (err) {
      console.error("Failed to auto-create overdue fines for report:", err.message);
    }

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

    const DEFAULT_GRACE_DAYS = 0; // no grace period

    // Build grace filter clause
    let graceWhere = "DATEDIFF(CURDATE(), l.due_date) >= 1"; // any day past due

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
        GREATEST(DATEDIFF(CURDATE(), l.due_date), 0) AS days_overdue,
        0 AS within_grace,
        CASE WHEN f.fine_id IS NOT NULL THEN f.amount_assessed END AS assessed_fine,
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(0, DATEDIFF(CURDATE(), l.due_date)) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
          ), 2
        ) AS dynamic_est_fine,
        COALESCE(
          f.amount_assessed,
          ROUND(
            LEAST(
              COALESCE(l.max_fine_snapshot, 99999),
              GREATEST(0, DATEDIFF(CURDATE(), l.due_date)) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
            ), 2
          )
        ) AS current_fine,
        ROUND(
          LEAST(
            COALESCE(l.max_fine_snapshot, 99999),
            GREATEST(0, DATEDIFF(CURDATE(), l.due_date)) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
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
                CASE
                  WHEN l.status = 'lost' THEN ?
                  ELSE LEAST(
                    COALESCE(l.max_fine_snapshot, 99999),
                    GREATEST(0, DATEDIFF(CURDATE(), l.due_date)) * COALESCE(l.daily_fine_rate_snapshot, 1.25)
                  )
                END, 2
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
    const [rows] = await pool.query(sql, [LOST_FLAT_FEE, startDate, endDate]);
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
    const timeframeParam = (url.searchParams.get("timeframe") || "month").trim().toLowerCase();
    const timeframe = TIMEFRAMES.has(timeframeParam) ? timeframeParam : "month";
    const userTypeFilter = parseListParam(url.searchParams.get("user_type"));

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let startDate = startDateParam;
    let endDate = endDateParam;

    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      startDate = yearAgo.toISOString().slice(0, 10);
    }

    if (new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const [rawRows] = await pool.query(
      `
        SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.is_faculty,
          u.joined_at,
          a.role AS account_role
        FROM user u
        LEFT JOIN account a ON a.user_id = u.user_id
        WHERE u.joined_at IS NOT NULL
          AND u.joined_at >= ?
          AND u.joined_at <= ?
      `,
      [startDate, endDate]
    );

    const alignedStart = startOfBucket(parseDateOnly(startDate), timeframe);
    const alignedEnd = parseDateOnly(endDate);
    const bucketOrder = [];
    const bucketMap = new Map();
    let cursor = new Date(alignedStart.getTime());
    while (cursor <= alignedEnd) {
      const bucketKey = `${timeframe}:${isoDate(cursor)}`;
      bucketOrder.push(bucketKey);
      bucketMap.set(bucketKey, {
        start: new Date(cursor.getTime()),
        end: bucketEnd(cursor, timeframe),
        label: bucketLabel(cursor, timeframe),
        total: 0,
        breakdown: {},
        patrons: [],
      });
      cursor = advanceBucket(cursor, timeframe);
    }

    const normalizeDateString = (value) => {
      if (!value) return null;
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      return String(value).slice(0, 10);
    };

    const availableUserTypes = new Set();

    const normalizedRows = rawRows
      .map((row) => {
        const userType = normalizeUserType(row.account_role, row.is_faculty);
        const joined_at = normalizeDateString(row.joined_at);
        if (!joined_at) return null;
        availableUserTypes.add(userType);
        const firstName = row.first_name || "";
        const lastName = row.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || row.email || `User ${row.user_id}`;
        return {
          user_id: Number(row.user_id),
          joined_at,
          user_type: userType,
          email: row.email,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
        };
      })
      .filter(Boolean);

    const filteredRows = normalizedRows.filter((row) => {
      if (userTypeFilter.length && !userTypeFilter.includes(row.user_type)) return false;
      return true;
    });

    const totalsByType = {};

    filteredRows.forEach((row) => {
      totalsByType[row.user_type] = (totalsByType[row.user_type] || 0) + 1;
      const joinedDate = parseDateOnly(row.joined_at);
      const bucketKey = `${timeframe}:${isoDate(startOfBucket(joinedDate, timeframe))}`;
      const bucket = bucketMap.get(bucketKey);
      if (!bucket) return;
      bucket.total += 1;
      bucket.breakdown[row.user_type] = (bucket.breakdown[row.user_type] || 0) + 1;
      bucket.patrons.push({
        patron_id: row.user_id,
        patron_name: row.full_name,
        patron_type: row.user_type,
      });
    });

    const totalNewPatrons = filteredRows.length;
    let runningTotal = 0;
    const timeline = bucketOrder.map((key, idx) => {
      const bucket = bucketMap.get(key);
      runningTotal += bucket.total;
      const prev = idx > 0 ? bucketMap.get(bucketOrder[idx - 1]).total : null;
      const change = percentDiff(bucket.total, prev);
      const percentOfTotal =
        totalNewPatrons === 0 ? 0 : Number(((bucket.total / totalNewPatrons) * 100).toFixed(1));
      return {
        key,
        label: bucket.label,
        bucketStart: isoDate(bucket.start),
        bucketEnd: isoDate(bucket.end),
        total: bucket.total,
        breakdown: bucket.breakdown,
        cumulative: runningTotal,
        percentOfTotal,
        changePercent: change === null ? null : Number(change.toFixed(1)),
        patrons: bucket.patrons,
      };
    });

    const tableRows = timeline.map((entry) => ({
      row_key: entry.key,
      period: entry.label,
      start_date: entry.bucketStart,
      end_date: entry.bucketEnd,
      new_patrons: entry.total,
      cumulative: entry.cumulative,
      percent_of_total: entry.percentOfTotal,
      change_percent: entry.changePercent,
      patrons: Array.isArray(entry.patrons) ? entry.patrons : [],
    }));

    const averagePerBucket =
      timeline.length === 0 ? 0 : Number((totalNewPatrons / timeline.length).toFixed(1));
    const latest = timeline[timeline.length - 1];
    const meta = {
      startDate,
      endDate,
      timeframe,
      totalNewPatrons,
      bucketCount: timeline.length,
      averagePerBucket,
      latestPeriod: latest ? latest.label : null,
      lastChangePercent: latest?.changePercent ?? null,
    };

    let topPeriods = [...timeline]
      .filter((period) => period.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((period) => ({
        label: period.label,
        total: period.total,
        start_date: period.bucketStart,
        end_date: period.bucketEnd,
        percent_of_total: period.percentOfTotal,
      }));
    if (!topPeriods.length) {
      topPeriods = timeline.slice(-3).map((period) => ({
        label: period.label,
        total: period.total,
        start_date: period.bucketStart,
        end_date: period.bucketEnd,
        percent_of_total: period.percentOfTotal,
      }));
    }

    const retentionSummary = {
      cohortLabel: "Last 30 days",
      cohortSize: 0,
      engagedCount: 0,
      engagementRate: 0,
      windowStart: null,
      windowEnd: endDate,
      avgTimeToFirstActionHours: null,
      firstActionSampleSize: 0,
    };

    if (filteredRows.length) {
      const retentionEnd = parseDateOnly(endDate);
      const retentionStart = new Date(retentionEnd.getTime());
      retentionStart.setUTCDate(retentionStart.getUTCDate() - 30);
      const retentionStartStr = isoDate(retentionStart);
      const cohort = filteredRows.filter((row) => row.joined_at >= retentionStartStr);
      retentionSummary.cohortSize = cohort.length;
      retentionSummary.windowStart = retentionStartStr;
      if (cohort.length) {
        const uniqueIds = Array.from(new Set(cohort.map((row) => row.user_id)));
        const engagedSet = new Set();
        const chunkSize = 500;
        for (let i = 0; i < uniqueIds.length; i += chunkSize) {
          const chunk = uniqueIds.slice(i, i + chunkSize);
          const placeholders = chunk.map(() => "?").join(",");
          const params = [...chunk, retentionStartStr, endDate];
          const [loanRows] = await pool.query(
            `
              SELECT DISTINCT user_id
              FROM loan
              WHERE user_id IN (${placeholders})
                AND checkout_date BETWEEN ? AND ?
            `,
            params
          );
          loanRows.forEach((loanRow) => engagedSet.add(Number(loanRow.user_id)));
        }
        const engagedCount = cohort.filter((row) => engagedSet.has(row.user_id)).length;
        retentionSummary.engagedCount = engagedCount;
        retentionSummary.engagementRate = cohort.length
          ? Number(((engagedCount / cohort.length) * 100).toFixed(1))
          : 0;
      }
    }

    if (filteredRows.length) {
      const uniquePatronIds = Array.from(
        new Set(
          filteredRows
            .map((row) => Number(row.user_id))
            .filter((id) => Number.isFinite(id))
        )
      );
      if (uniquePatronIds.length) {
        const firstActionMap = new Map();
        const recordFirstAction = (userId, timestamp) => {
          if (!timestamp) return;
          const ms = Date.parse(timestamp);
          if (!Number.isFinite(ms)) return;
          const existing = firstActionMap.get(userId);
          if (existing === undefined || ms < existing) {
            firstActionMap.set(userId, ms);
          }
        };
        const chunkSize = 400;
        for (let i = 0; i < uniquePatronIds.length; i += chunkSize) {
          const chunk = uniquePatronIds.slice(i, i + chunkSize);
          if (!chunk.length) continue;
          const placeholders = chunk.map(() => "?").join(",");
          const [loanFirstRows] = await pool.query(
            `
              SELECT user_id, MIN(checkout_date) AS first_checkout
              FROM loan
              WHERE user_id IN (${placeholders})
                AND checkout_date IS NOT NULL
              GROUP BY user_id
            `,
            chunk
          );
          loanFirstRows.forEach((row) => recordFirstAction(Number(row.user_id), row.first_checkout));
          const [reservationFirstRows] = await pool.query(
            `
              SELECT user_id, MIN(start_time) AS first_reservation
              FROM reservation
              WHERE user_id IN (${placeholders})
                AND start_time IS NOT NULL
              GROUP BY user_id
            `,
            chunk
          );
          reservationFirstRows.forEach((row) =>
            recordFirstAction(Number(row.user_id), row.first_reservation)
          );
        }

        const actionDiffs = [];
        filteredRows.forEach((row) => {
          const joinedMs = Date.parse(row.joined_at);
          if (!Number.isFinite(joinedMs)) return;
          const firstActionMs = firstActionMap.get(Number(row.user_id));
          if (!Number.isFinite(firstActionMs)) return;
          const delta = firstActionMs - joinedMs;
          if (delta >= 0) actionDiffs.push(delta);
        });

        if (actionDiffs.length) {
          const avgMs = actionDiffs.reduce((sum, value) => sum + value, 0) / actionDiffs.length;
          const avgHours = avgMs / (60 * 60 * 1000);
          retentionSummary.avgTimeToFirstActionHours = Number(avgHours.toFixed(1));
          retentionSummary.firstActionSampleSize = actionDiffs.length;
        }
      }
    }

    return sendJSON(res, 200, {
      meta,
      timeline,
      tableRows,
      breakdowns: {
        byType: totalsByType,
      },
      topPeriods,
      retention: retentionSummary,
      filterOptions: {
        userTypes: Array.from(availableUserTypes).sort(),
      },
      appliedFilters: {
        userTypes: userTypeFilter,
      },
    });
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
    // Pagination
    const pageParam = Number(url.searchParams.get("page") || 1);
    const pageSizeParam = Number(url.searchParams.get("pageSize") || 50);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.max(1, Math.floor(pageParam)) : 1;
    const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.min(500, Math.floor(pageSizeParam)) : 50;

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
      LIMIT ? OFFSET ?
    `;
    try {
      // total count for pagination
      const countSql = `SELECT COUNT(*) AS total
        FROM \`transaction\` t
        JOIN user u     ON u.user_id = t.user_id
        JOIN copy c     ON c.copy_id = t.copy_id
        JOIN item i     ON i.item_id = c.item_id
        LEFT JOIN employee e ON e.employee_id = t.employee_id
        ${latestStatusJoin}
        ${whereClause}`;
      const [[countRow]] = await pool.query(countSql, params);
      const total = Number(countRow?.total || 0);
      const offset = (page - 1) * pageSize;
      const [rows] = await pool.query(sql, [...params, pageSize, offset]);
      return sendJSON(res, 200, { rows, page, pageSize, total });
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
        // pagination-aware fallback
        const countFallbackSql = `SELECT COUNT(*) AS total FROM ( ${fbSql.replace(/\n\s*ORDER BY[\s\S]*$/i, "").replace(/\n\s*LIMIT\s+500\s*$/i, "")} ) q`;
        const [[countRow]] = await pool.query(countFallbackSql, params);
        const total = Number(countRow?.total || 0);
        const offset = (page - 1) * pageSize;
        const pagedFbSql = fbSql.replace(/LIMIT\s+500\s*$/i, 'LIMIT ? OFFSET ?');
        const [rows] = await pool.query(pagedFbSql, [...params, pageSize, offset]);
        return sendJSON(res, 200, { rows, page, pageSize, total });
      } catch (e2) {
        console.error('transactions fallback (transaction table) failed, trying loans-only:', e2.message);
        // Loans-only fallback, extended to include pending requests as "requested",
        // and approvals/returns from loan timestamps. Also add best-effort rejected events
        // directly from transaction table if available.
        const loansSql = `
          SELECT
            CONCAT('loan-', l.loan_id, '-requested')    AS transaction_id,
            l.loan_id,
            l.copy_id,
            'requested'                                 AS event_type,
            l.checkout_date                              AS event_timestamp,
            'requested'                                 AS raw_type,
            u.user_id,
            u.email                                    AS user_email,
            u.first_name                               AS user_first_name,
            u.last_name                                AS user_last_name,
            NULL                                       AS employee_id,
            NULL                                       AS employee_first_name,
            NULL                                       AS employee_last_name,
            i.title                                    AS item_title,
            'Pending'                                  AS current_status
          FROM loan l
          JOIN user u ON u.user_id = l.user_id
          JOIN copy c ON c.copy_id = l.copy_id
          JOIN item i ON i.item_id = c.item_id
          WHERE l.status = 'pending' AND l.checkout_date IS NOT NULL AND l.checkout_date BETWEEN ? AND ?
          UNION ALL
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
          UNION ALL
          SELECT
            t.transaction_id,
            t.loan_id,
            t.copy_id,
            'rejected'                                 AS event_type,
            t.\`date\`                                 AS event_timestamp,
            'rejected'                                 AS raw_type,
            u.user_id,
            u.email                                    AS user_email,
            u.first_name                               AS user_first_name,
            u.last_name                                AS user_last_name,
            NULL                                       AS employee_id,
            NULL                                       AS employee_first_name,
            NULL                                       AS employee_last_name,
            i.title                                    AS item_title,
            'Rejected'                                 AS current_status
          FROM \`transaction\` t
          JOIN user u ON u.user_id = t.user_id
          JOIN copy c ON c.copy_id = t.copy_id
          JOIN item i ON i.item_id = c.item_id
          WHERE t.\`type\` IN ('rejected','checkout_rejected') AND t.\`date\` BETWEEN ? AND ?
          ORDER BY event_timestamp DESC
          LIMIT 500
        `;
        // pagination for loans fallback
        const baseLoansSql = loansSql.replace(/\n\s*ORDER BY[\s\S]*$/i, '');
        const countLoansSql = `SELECT COUNT(*) AS total FROM ( ${baseLoansSql} ) q`;
        const [[countLoans]] = await pool.query(countLoansSql, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]);
        const total = Number(countLoans?.total || 0);
        const offset = (page - 1) * pageSize;
        const pagedLoansSql = loansSql.replace(/LIMIT\s+500\s*$/i, 'LIMIT ? OFFSET ?');
        const [rows] = await pool.query(pagedLoansSql, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, pageSize, offset]);
        return sendJSON(res, 200, { rows, page, pageSize, total });
      }
    }
  }catch (err) {
    console.error("Failed to load transactions:", err.message);
    return sendJSON(res, 500, { error: "transactions_query_failed" });
  }
};

// New implementation using loan_events as the source of truth.
// Keeps the same output shape expected by the UI.
export const listTransactionsEvents = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff"); if (!auth) return;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();
    const typesParam = (url.searchParams.get("types") || "").trim();
    const staffParam = (url.searchParams.get("staff") || "").trim();
    const qParam = (url.searchParams.get("q") || "").trim();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let startDate = startDateParam;
    let endDate = endDateParam;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      startDate = yearAgo.toISOString().slice(0, 10);
    }
    if (new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const conditions = [];
    const params = [];
    // Pagination
    const pageParam = Number(url.searchParams.get("page") || 1);
    const pageSizeParam = Number(url.searchParams.get("pageSize") || 50);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.max(1, Math.floor(pageParam)) : 1;
    const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.min(500, Math.floor(pageSizeParam)) : 50;
    // date range (end is exclusive to include entire day)
    conditions.push("(le.event_date >= ? AND le.event_date < DATE_ADD(?, INTERVAL 1 DAY))");
    params.push(startDate, endDate);

    // Normalize event types
    const eventTypeExpr = `CASE
      WHEN le.\`type\` IN ('requested','checkout_request') THEN 'requested'
      WHEN le.\`type\` IN ('approved','checkout','checked_out') THEN 'approved'
      WHEN le.\`type\` IN ('rejected','checkout_rejected') THEN 'rejected'
      WHEN le.\`type\` IN ('returned','return','checkin','checked_in') THEN 'returned'
      ELSE LOWER(le.\`type\`)
    END`;

    // Event type filter
    let typeList = [];
    if (typesParam) {
      typeList = typesParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (typeList.length) {
        conditions.push(`${eventTypeExpr} IN (${typeList.map(() => '?').join(',')})`);
        params.push(...typeList);
      }
    }

    // Staff filter
    if (staffParam) {
      const isNumeric = /^\d+$/.test(staffParam);
      if (isNumeric) {
        conditions.push("le.employee_id = ?");
        params.push(Number(staffParam));
      } else {
        conditions.push("(CONCAT(COALESCE(e.first_name,''),' ',COALESCE(e.last_name,'')) LIKE ?)");
        params.push(`%${staffParam}%`);
      }
    }

    // Free text search
    if (qParam) {
      const like = `%${qParam}%`;
      conditions.push("(u.email LIKE ? OR CONCAT(u.first_name,' ',u.last_name) LIKE ? OR i.title LIKE ? OR CAST(le.loan_id AS CHAR) LIKE ? OR CAST(le.copy_id AS CHAR) LIKE ?)");
      params.push(like, like, like, like, like);
    }

    // Current status per loan from latest loan_event (no date limit)
    const latestStatusJoin = `
      LEFT JOIN (
        SELECT le2.loan_id,
               CASE
                 WHEN le2.\`type\` IN ('requested','checkout_request') THEN 'Pending'
                 WHEN le2.\`type\` IN ('approved','checkout','checked_out') THEN 'Approved & Active'
                 WHEN le2.\`type\` IN ('rejected','checkout_rejected') THEN 'Rejected'
                 WHEN le2.\`type\` IN ('returned','return','checkin','checked_in') THEN 'Returned'
                 ELSE '—'
               END AS current_status
        FROM \`loan_events\` le2
        JOIN (
          SELECT loan_id, MAX(\`event_date\`) AS max_date
          FROM \`loan_events\`
          WHERE loan_id IS NOT NULL
          GROUP BY loan_id
        ) last ON last.loan_id = le2.loan_id AND le2.\`event_date\` = last.max_date
      ) ls ON ls.loan_id = le.loan_id
    `;


    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const whereClauseNoStatus = conditions.length ? `WHERE ${conditions.filter(c => !c.includes('ls.current_status')).join(" AND ")}` : "";
    const sql = `
      SELECT
        le.event_id      AS transaction_id,
        le.loan_id,
        le.copy_id,
        ${eventTypeExpr} AS event_type,
        le.\`event_date\` AS event_timestamp,
        le.\`type\`      AS raw_type,
        u.user_id,
        u.email           AS user_email,
        u.first_name      AS user_first_name,
        u.last_name       AS user_last_name,
        e.employee_id,
        e.first_name      AS employee_first_name,
        e.last_name       AS employee_last_name,
        i.title           AS item_title,
        ls.current_status
      FROM \`loan_events\` le
      JOIN user u     ON u.user_id = le.user_id
      JOIN copy c     ON c.copy_id = le.copy_id
      JOIN item i     ON i.item_id = c.item_id
      LEFT JOIN employee e ON e.employee_id = le.employee_id
      ${latestStatusJoin}
      ${whereClause}
      ORDER BY le.\`event_date\` DESC, le.event_id DESC
      LIMIT ? OFFSET ?
    `;

    try {
      // Count total matching rows for pagination
      const countSql = `SELECT COUNT(*) AS total 
        FROM \`loan_events\` le
        JOIN user u     ON u.user_id = le.user_id
        JOIN copy c     ON c.copy_id = le.copy_id
        JOIN item i     ON i.item_id = c.item_id
        LEFT JOIN employee e ON e.employee_id = le.employee_id
        ${latestStatusJoin}
        ${whereClause}`;
      const [[countRow]] = await pool.query(countSql, params);
      const total = Number(countRow?.total || 0);
      const offset = (page - 1) * pageSize;
      const [rows] = await pool.query(sql, [...params, pageSize, offset]);
      return sendJSON(res, 200, { rows, page, pageSize, total });
    } catch (e) {
      console.error('loan_events main query failed:', e.message);
      // Minimal fallback from loan_events without joins
      const fb = `
        SELECT
          le.event_id AS transaction_id,
          le.loan_id,
          le.copy_id,
          ${eventTypeExpr} AS event_type,
          le.\`event_date\` AS event_timestamp,
          le.\`type\` AS raw_type,
          NULL AS user_id,
          NULL AS user_email,
          NULL AS user_first_name,
          NULL AS user_last_name,
          NULL AS employee_id,
          NULL AS employee_first_name,
          NULL AS employee_last_name,
          NULL AS item_title,
          NULL AS current_status
        FROM \`loan_events\` le
        ${whereClauseNoStatus}
        ORDER BY le.\`event_date\` DESC, le.event_id DESC
        LIMIT 500
      `;
      try {
        const countFbSql = `SELECT COUNT(*) AS total FROM ( ${fb.replace(/\n\s*ORDER BY[\s\S]*$/i, '').replace(/\n\s*LIMIT\s+500\s*$/i, '')} ) q`;
        const [[countFb]] = await pool.query(countFbSql, params);
        const total = Number(countFb?.total || 0);
        const offset = (page - 1) * pageSize;
        const [rows] = await pool.query(fb.replace(/LIMIT\s+500\s*$/i, 'LIMIT ? OFFSET ?'), [...params, pageSize, offset]);
        return sendJSON(res, 200, { rows, page, pageSize, total });
      } catch (e2) {
        console.error('loan_events fallback failed, switching to transaction table:', e2.message);
        // Final fallback: use transaction table (same filters adapted)
        const tEventTypeExpr = `CASE
          WHEN t.\`type\` IN ('requested','checkout_request') THEN 'requested'
          WHEN t.\`type\` IN ('approved','checkout_approved','checked_out') THEN 'approved'
          WHEN t.\`type\` IN ('rejected','checkout_rejected') THEN 'rejected'
          WHEN t.\`type\` IN ('returned','checkin','checked_in') THEN 'returned'
          ELSE LOWER(t.\`type\`)
        END`;
        const tConditions = [];
        const tParams = [];
        tConditions.push("t.date BETWEEN ? AND ?");
        tParams.push(startDate, endDate);
        if (typesParam) {
          const typeList = typesParam.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
          if (typeList.length) {
            tConditions.push(`${tEventTypeExpr} IN (${typeList.map(()=>'?').join(',')})`);
            tParams.push(...typeList);
          }
        }
        if (staffParam) {
          const isNumeric = /^\d+$/.test(staffParam);
          if (isNumeric) { tConditions.push('t.employee_id = ?'); tParams.push(Number(staffParam)); }
          else { tConditions.push("(CONCAT(COALESCE(e.first_name,''),' ',COALESCE(e.last_name,'')) LIKE ?)"); tParams.push(`%${staffParam}%`); }
        }
        if (qParam) {
          const like = `%${qParam}%`;
          tConditions.push("(u.email LIKE ? OR CONCAT(u.first_name,' ',u.last_name) LIKE ? OR i.title LIKE ? OR CAST(t.loan_id AS CHAR) LIKE ? OR CAST(t.copy_id AS CHAR) LIKE ?)");
          tParams.push(like, like, like, like, like);
        }
        const tLatestStatusJoin = `
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
        let tWhere = tConditions.length ? `WHERE ${tConditions.join(' AND ')}` : '';
        const tCountSql = `SELECT COUNT(*) AS total
          FROM \`transaction\` t
          JOIN user u     ON u.user_id = t.user_id
          JOIN copy c     ON c.copy_id = t.copy_id
          JOIN item i     ON i.item_id = c.item_id
          LEFT JOIN employee e ON e.employee_id = t.employee_id
          ${tLatestStatusJoin}
          ${tWhere}`;
        const [[tCount]] = await pool.query(tCountSql, tParams);
        const total = Number(tCount?.total || 0);
        const offset = (page - 1) * pageSize;
        const tSql = `
          SELECT
            t.transaction_id,
            t.loan_id,
            t.copy_id,
            ${tEventTypeExpr} AS event_type,
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
          ${tLatestStatusJoin}
          ${tWhere}
          ORDER BY t.\`date\` DESC, t.transaction_id DESC
          LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query(tSql, [...tParams, pageSize, offset]);
        return sendJSON(res, 200, { rows, page, pageSize, total });
      }
    }
  } catch (err) {
    console.error("Failed to load transactions (loan_events)", err.message);
    return sendJSON(res, 500, { error: "transactions_query_failed" });
  }
};
