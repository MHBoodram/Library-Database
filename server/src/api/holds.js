import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";
import { assignCopyToNextHold, isStaffAuth } from "../lib/holdQueue.js";
import { determineLoanLimit, defaultLoanDays, resolvePolicy, getDueDateISO, insertLoanRecord } from "../lib/loanRules.js";
import { resolveHoldNotifications } from "../lib/notifications.js";

function resolveUserId(auth, override) {
  return Number(
    override ||
    auth?.uid ||
    auth?.user_id ||
    auth?.userId
  );
}

export const placeHold = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = resolveUserId(auth, b.user_id);
  let item_id = Number(b.item_id) || null;
  const copy_id = Number(b.copy_id) || null;
  if (!user_id || (!item_id && !copy_id) || (item_id && copy_id))
    return sendJSON(res, 400, { error:"invalid_payload", message: "Provide either item_id or copy_id." });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (!item_id && copy_id) {
      const [rows] = await conn.query("SELECT item_id FROM copy WHERE copy_id = ?", [copy_id]);
      if (!rows.length) {
        throw new Error("copy_not_found");
      }
      item_id = Number(rows[0].item_id);
    }

    const [[posRow]] = await conn.query(
      "SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position FROM hold WHERE item_id = ?",
      [item_id]
    );
    const queue_position = Number(posRow?.next_position || 1);

    const [r] = await conn.execute(
      "INSERT INTO hold(user_id,item_id,copy_id,status,queue_position,available_since,expires_at) VALUES(?,?,?,?,?,NULL,NULL)",
      [user_id, item_id, copy_id || null, "queued", queue_position]
    );

    await conn.commit();
    return sendJSON(res, 201, { hold_id: r.insertId, queue_position });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to place hold:", err);
    if (err.message === "copy_not_found") {
      return sendJSON(res, 404, { error: "copy_not_found" });
    }
    return sendJSON(res, 500, { error: "server_error", message: err.message });
  } finally {
    conn.release();
  }
};

export const cancelHold = (JWT_SECRET, { restrictToSelf = true } = {}) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const hold_id = Number(params.id);
  if (!hold_id) return sendJSON(res, 400, { error: "invalid_hold" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hold = await loadHoldForUpdate(conn, hold_id);
    if (!hold) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "hold_not_found" });
    }

    const requestUserId = resolveUserId(auth);
    const staffManaging = !restrictToSelf && isStaffAuth(auth);
    const canManage =
      staffManaging ||
      (!restrictToSelf && hold.user_id === requestUserId) ||
      (restrictToSelf && hold.user_id === requestUserId);

    if (!canManage) {
      await conn.rollback();
      return sendJSON(res, 403, { error: "forbidden" });
    }

    if (!["queued", "ready"].includes(hold.status)) {
      await conn.rollback();
      return sendJSON(res, 409, { error: "hold_not_cancellable" });
    }

    await cancelHoldRecord(conn, hold, "cancelled");
    await conn.commit();
    return sendJSON(res, 200, { ok: true, status: "cancelled" });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("cancelHold error", err);
    return sendJSON(res, 500, { error: "cancel_hold_failed" });
  } finally {
    conn.release();
  }
};

export const declineHold = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const hold_id = Number(params.id);
  if (!hold_id) return sendJSON(res, 400, { error: "invalid_hold" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hold = await loadHoldForUpdate(conn, hold_id);
    if (!hold) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "hold_not_found" });
    }
    const requester = resolveUserId(auth);
    if (hold.user_id !== requester && !isStaffAuth(auth)) {
      await conn.rollback();
      return sendJSON(res, 403, { error: "forbidden" });
    }
    if (hold.status !== "ready") {
      await conn.rollback();
      return sendJSON(res, 409, { error: "hold_not_ready" });
    }

    await cancelHoldRecord(conn, hold, "cancelled");
    await conn.commit();
    return sendJSON(res, 200, { ok: true, status: "cancelled" });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("declineHold error", err);
    return sendJSON(res, 500, { error: "decline_failed" });
  } finally {
    conn.release();
  }
};

export const acceptHold = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const hold_id = Number(params.id);
  if (!hold_id) return sendJSON(res, 400, { error: "invalid_hold" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hold = await loadHoldForUpdate(conn, hold_id);
    if (!hold) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "hold_not_found" });
    }

    const requester = resolveUserId(auth);
    if (hold.user_id !== requester && !isStaffAuth(auth)) {
      await conn.rollback();
      return sendJSON(res, 403, { error: "forbidden" });
    }

    if (hold.status !== "ready" || !hold.copy_id) {
      await conn.rollback();
      return sendJSON(res, 409, { error: "hold_not_ready" });
    }

    if (hold.expires_at && new Date(hold.expires_at) < new Date()) {
      await cancelHoldRecord(conn, hold, "expired");
      await conn.commit();
      return sendJSON(res, 409, { error: "hold_expired" });
    }

    const borrower = await fetchBorrowerContext(conn, hold.user_id);
    await enforceLoanLimit(conn, hold.user_id, borrower.loanLimit);

    const [copyRows] = await conn.query(
      "SELECT copy_id, item_id, status FROM copy WHERE copy_id = ? FOR UPDATE",
      [hold.copy_id]
    );
    if (!copyRows.length) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "copy_not_found" });
    }
    const copy = copyRows[0];
    if (copy.item_id !== hold.item_id) {
      await conn.rollback();
      return sendJSON(res, 409, { error: "copy_mismatch" });
    }
    if (copy.status !== "on_hold" && copy.status !== "available") {
      await conn.rollback();
      return sendJSON(res, 409, { error: "copy_unavailable", status: copy.status });
    }

    const policy = await resolvePolicy(conn, hold.item_id, borrower.userCategory);
    const loanDays = Number(policy?.loan_days) || defaultLoanDays(borrower.accountRole);
    const dueDate = getDueDateISO(loanDays);

    const insertResult = await insertLoanRecord(conn, {
      user_id: hold.user_id,
      copy_id: hold.copy_id,
      employee_id: auth.employee_id || null,
      dueDate,
      policy,
    });

    await conn.execute("UPDATE hold SET status='fulfilled', expires_at=NULL WHERE hold_id=?", [hold.hold_id]);
    await conn.execute("UPDATE copy SET status='on_loan' WHERE copy_id=?", [hold.copy_id]);
    await resolveHoldNotifications(conn, hold.hold_id);

    await conn.commit();

    try {
      await pool.query(
        `INSERT INTO loan_events (loan_id, user_id, copy_id, employee_id, type, event_date)
         VALUES (?, ?, ?, ?, 'checkout', NOW())`,
        [insertResult.insertId, hold.user_id, hold.copy_id, auth.employee_id || null]
      );
    } catch {}

    return sendJSON(res, 200, {
      ok: true,
      loan_id: insertResult.insertId,
      due_date: dueDate,
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    if (err?.message === "loan_limit_exceeded") {
      return sendJSON(res, err.status || 409, {
        error: "loan_limit_exceeded",
        message: `Patron already has ${err.activeLoans ?? "too many"} active loans (limit ${err.limit}).`,
      });
    }
    if (err?.message === "user_not_found") {
      return sendJSON(res, err.status || 404, { error: "user_not_found" });
    }
    console.error("acceptHold error", err);
    return sendJSON(res, 500, { error: "accept_failed" });
  } finally {
    conn.release();
  }
};

export const listHolds = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  const queryScope = (req.url || "").includes("/api/staff/holds") ? "staff" : "self";
  if (queryScope === "staff") {
    const isStaff = Boolean(auth.employee_id);
    const role = (auth.role || "").toLowerCase();
    if (!isStaff && role !== "staff" && role !== "admin") {
      return sendJSON(res, 403, { error: "forbidden" });
    }
  }
  const filterUserId = queryScope === "self" ? resolveUserId(auth) : null;

  try {
    const [rows] = await pool.query(
      `
        SELECT
          h.hold_id,
          h.status,
          h.queue_position,
          h.available_since,
          h.expires_at,
          h.created_at,
          h.item_id,
          i.title AS item_title,
          h.user_id,
          u.first_name,
          u.last_name,
          u.email,
          h.copy_id,
          c.barcode AS copy_barcode
        FROM hold h
        JOIN item i ON i.item_id = h.item_id
        JOIN user u ON u.user_id = h.user_id
        LEFT JOIN copy c ON c.copy_id = h.copy_id
        ${filterUserId ? "WHERE h.user_id = ?" : ""}
        ORDER BY FIELD(h.status,'ready','queued','fulfilled','cancelled','expired'),
                 h.queue_position ASC,
                 h.created_at ASC
      `
      , filterUserId ? [filterUserId] : []
    );
    return sendJSON(res, 200, { rows });
  } catch (err) {
    console.error("Failed to list holds:", err);
    return sendJSON(res, 500, { error: "holds_query_failed" });
  }
};

async function loadHoldForUpdate(conn, holdId) {
  const [rows] = await conn.query(
    `
      SELECT hold_id, user_id, item_id, copy_id, status, available_since, expires_at
      FROM hold
      WHERE hold_id = ?
      FOR UPDATE
    `,
    [holdId]
  );
  return rows[0] || null;
}

async function cancelHoldRecord(conn, hold, newStatus = "cancelled") {
  if (hold.status === "ready" && hold.copy_id) {
    await conn.execute(
      "UPDATE hold SET status=?, copy_id=NULL, available_since=NULL, expires_at=NULL WHERE hold_id=?",
      [newStatus, hold.hold_id]
    );
    await conn.execute("UPDATE copy SET status='available' WHERE copy_id=?", [hold.copy_id]);
    await assignCopyToNextHold(conn, hold.copy_id, hold.item_id);
  } else {
    await conn.execute("UPDATE hold SET status=? WHERE hold_id=?", [newStatus, hold.hold_id]);
  }
  await resolveHoldNotifications(conn, hold.hold_id);
}

async function fetchBorrowerContext(conn, userId) {
  const [rows] = await conn.query(
    `
      SELECT
        u.user_id,
        COALESCE(a.role, 'student') AS account_role
      FROM user u
      LEFT JOIN account a ON a.user_id = u.user_id
      WHERE u.user_id = ?
      ORDER BY a.account_id ASC
      LIMIT 1
    `,
    [userId]
  );
  if (!rows.length) {
    const err = new Error("user_not_found");
    err.status = 404;
    throw err;
  }
  const accountRole = (rows[0]?.account_role || "student").toLowerCase();
  const userCategory = accountRole === "faculty" ? "faculty" : "student";
  const loanLimit = determineLoanLimit(accountRole);
  return { accountRole, userCategory, loanLimit };
}

async function enforceLoanLimit(conn, userId, limit) {
  if (!limit) return;
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS active_loans FROM loan WHERE user_id = ? AND status = 'active'",
    [userId]
  );
  const activeLoans = Number(rows[0]?.active_loans ?? 0);
  if (activeLoans >= limit) {
    const err = new Error("loan_limit_exceeded");
    err.status = 409;
    err.activeLoans = activeLoans;
    err.limit = limit;
    throw err;
  }
}
