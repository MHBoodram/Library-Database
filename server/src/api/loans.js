import { sendJSON, readJSONBody, requireAuth, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const checkout = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = Number(b.user_id || auth.user_id);
  const identifierType = (b.identifier_type || "").toString().trim().toLowerCase();
  const explicitMode = identifierType === "barcode" ? "barcode" : identifierType === "copy_id" ? "copy_id" : null;
  const copyIdInput = Number(b.copy_id);
  const barcodeInput = typeof b.barcode === "string" ? b.barcode.trim() : "";
  const employee_id = Number(b.employee_id) || null;

  if (!user_id) {
    return sendJSON(res, 400, { error:"invalid_payload", message: "User ID is required." });
  }

  const mode = explicitMode || (copyIdInput ? "copy_id" : barcodeInput ? "barcode" : "copy_id");
  if (mode === "copy_id" && (!Number.isInteger(copyIdInput) || copyIdInput <= 0)) {
    return sendJSON(res, 400, { error:"invalid_payload", message: "Valid copy_id is required." });
  }
  if (mode === "barcode" && !barcodeInput) {
    return sendJSON(res, 400, { error:"invalid_payload", message: "Barcode is required." });
  }

  try {
    const result = await performCheckout({
      user_id,
      copy_id: mode === "copy_id" ? copyIdInput : null,
      barcode: mode === "barcode" ? barcodeInput : "",
      employee_id,
    });
    return sendJSON(res, 201, {
      ok: true,
      loan_id: result.loan_id,
      due_date: result.due_date,
      policy_id: result.policy?.policy_id ?? null,
      policy_media_type: result.policy?.media_type ?? null,
    });
  } catch (e) {
    if (e?.appCode) {
      return sendJSON(res, e.status || 400, { error: e.appCode, message: e.message });
    }
    console.error("Checkout failed:", e);
    return sendJSON(res, 400, { error: "checkout_failed", details: e.message });
  }
};

// Patrons submit a checkout request instead of immediate checkout
export const requestCheckout = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = Number(auth.uid || auth.user_id);
  const copy_id = Number(b.copy_id);
  if (!user_id || !copy_id) {
    return sendJSON(res, 400, { error: "invalid_payload", message: "copy_id is required" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Ensure copy exists
    const [crows] = await conn.query(`SELECT c.copy_id, c.item_id FROM copy c WHERE c.copy_id = ? FOR UPDATE`, [copy_id]);
    if (!crows.length) { await conn.rollback(); return sendJSON(res, 404, { error: 'copy_not_found' }); }
    const copy = crows[0];

    // Determine policy for due date + snapshots
    const [itemTypeRows] = await conn.query(
      `SELECT CASE WHEN d.item_id IS NOT NULL THEN 'device' WHEN md.item_id IS NOT NULL THEN LOWER(md.media_type) ELSE 'book' END AS raw_media_type
       FROM item i LEFT JOIN device d ON d.item_id=i.item_id LEFT JOIN media md ON md.item_id=i.item_id WHERE i.item_id=? LIMIT 1`, [copy.item_id]);
    const rawMediaType = itemTypeRows[0]?.raw_media_type || 'book';
    const accountRoleRow = await conn.query(`SELECT COALESCE(a.role,'student') AS role FROM account a WHERE a.user_id=? LIMIT 1`, [user_id]).then(r=>r[0][0]).catch(()=>({role:'student'}));
    const userCategory = (accountRoleRow?.role||'student').toLowerCase()==='faculty'?'faculty':'student';
    const limit = userCategory === 'faculty' ? 7 : 5;
    // enforce limit across pending + active
    const [cntActiveRows] = await conn.query(`SELECT COUNT(*) AS n FROM loan WHERE user_id=? AND status IN ('active','pending')`, [user_id]);
    let current = Number(cntActiveRows[0]?.n || 0);
    // include legacy pending requests stored in transaction table
    try {
      const [cntTx] = await conn.query(`SELECT COUNT(*) AS n FROM transaction WHERE user_id=? AND type='checkout_request'`, [user_id]);
      current += Number(cntTx[0]?.n || 0);
    } catch {}
    if (current >= limit) {
      await conn.rollback();
      return sendJSON(res, 409, { error: 'loan_limit_exceeded', message: `Limit ${limit} reached (includes pending + active).` });
    }
    let loanDays = 14, dailyRate = null, graceDays = 3, maxFine = null, replacementFee = null;
    try {
      const [pol] = await conn.query(`SELECT loan_days,daily_rate,grace_days,max_fine,replacement_fee FROM fine_policy WHERE media_type=? AND user_category=? LIMIT 1`, [normalizePolicyMediaType(rawMediaType), userCategory]);
      if (pol.length) {
        loanDays = Number(pol[0].loan_days) || loanDays;
        dailyRate = pol[0].daily_rate;
        graceDays = Number.isFinite(Number(pol[0].grace_days)) ? Number(pol[0].grace_days) : graceDays;
        maxFine = pol[0].max_fine;
        replacementFee = pol[0].replacement_fee;
      }
    } catch {}
    const dueDate = getDueDateISO(loanDays);

    // Create pending loan (do not change copy status yet)
    let resIns;
    try {
      const [ins] = await conn.execute(`
        INSERT INTO loan (
          user_id, copy_id, employee_id, policy_id, checkout_date, due_date, status,
          daily_fine_rate_snapshot, grace_days_snapshot, max_fine_snapshot, replacement_fee_snapshot
        ) VALUES (?, ?, NULL, NULL, NOW(), ?, 'pending', ?, ?, ?, ?)
      `, [user_id, copy_id, dueDate, dailyRate, graceDays, maxFine, replacementFee]);
      resIns = ins;
    } catch (e) {
      // Fallback for schemas without snapshot/policy columns
      const msg = String(e?.message || "");
      if (e?.code === 'ER_BAD_FIELD_ERROR' || /Unknown column|doesn't exist/i.test(msg)) {
        // try legacy loan insert without snapshots
        try {
          const [insLegacy] = await conn.execute(`
            INSERT INTO loan (
              user_id, copy_id, employee_id, checkout_date, due_date, status
            ) VALUES (?, ?, NULL, NOW(), ?, 'pending')
          `, [user_id, copy_id, dueDate]);
          resIns = insLegacy;
        } catch (e2) {
          // If loan.status does not support 'pending', fall back to transaction table pending request
          const [insTx] = await conn.execute(`
            INSERT INTO transaction (loan_id, user_id, employee_id, copy_id, type, date)
            VALUES (NULL, ?, NULL, ?, 'checkout_request', NOW())
          `, [user_id, copy_id]);
          await conn.commit();
          return sendJSON(res, 201, { ok: true, request_id: insTx.insertId });
        }
      } else {
        // Unknown error, fall back to transaction-based request for resilience
        try {
          const [insTx] = await conn.execute(`
            INSERT INTO transaction (loan_id, user_id, employee_id, copy_id, type, date)
            VALUES (NULL, ?, NULL, ?, 'checkout_request', NOW())
          `, [user_id, copy_id]);
          await conn.commit();
          return sendJSON(res, 201, { ok: true, request_id: insTx.insertId });
        } catch (txErr) {
          throw e; // original error
        }
      }
    }
    await conn.commit();
    return sendJSON(res, 201, { ok: true, loan_id: resIns.insertId });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("checkout request failed:", err.message);
    return sendJSON(res, 500, { error: "checkout_request_failed" });
  } finally { conn.release(); }
};

// Patron: list my pending checkout requests
export const listMyPendingCheckouts = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const user_id = Number(auth.uid || auth.user_id);
  try {
    const sqlLoan = `
      SELECT l.loan_id, l.checkout_date AS request_date, l.copy_id, l.status,
             u.user_id, u.first_name, u.last_name,
             i.title AS item_title,
             CASE WHEN d.item_id IS NOT NULL THEN 'device'
                  WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
                  ELSE 'book' END AS media_type
      FROM loan l
      JOIN user u ON u.user_id = l.user_id
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE l.status = 'pending' AND l.user_id = ?
    `;
    const sqlTx = `
      SELECT NULL AS loan_id, t.date AS request_date, t.copy_id, 'pending' AS status,
             u.user_id, u.first_name, u.last_name,
             i.title AS item_title,
             CASE WHEN d.item_id IS NOT NULL THEN 'device'
                  WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
                  ELSE 'book' END AS media_type
      FROM transaction t
      JOIN user u ON u.user_id = t.user_id
      JOIN copy c ON c.copy_id = t.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE t.type = 'checkout_request' AND t.user_id = ?
    `;
    const [loanRows] = await pool.query(sqlLoan, [user_id]);
    let txRows = [];
    try { const r = await pool.query(sqlTx, [user_id]); txRows = r[0] || []; } catch {}
    const merged = [...loanRows, ...txRows].sort((a,b)=> new Date(b.request_date) - new Date(a.request_date)).slice(0,500);
    return sendJSON(res, 200, { rows: merged });
  } catch (err) {
    console.error("list my pending failed:", err.message);
    return sendJSON(res, 500, { error: "pending_list_failed" });
  }
};

// Staff: list all pending checkout requests
export const listPendingCheckouts = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, 'staff'); if (!auth) return;
  try {
    const sqlLoan = `
      SELECT l.loan_id, l.checkout_date AS request_date, l.copy_id, l.status,
             u.user_id, u.first_name, u.last_name,
             i.title AS item_title,
             CASE WHEN d.item_id IS NOT NULL THEN 'device'
                  WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
                  ELSE 'book' END AS media_type
      FROM loan l
      JOIN user u ON u.user_id = l.user_id
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE l.status = 'pending'
    `;
    const sqlTx = `
      SELECT NULL AS loan_id, t.date AS request_date, t.copy_id, 'pending' AS status,
             u.user_id, u.first_name, u.last_name,
             i.title AS item_title,
             CASE WHEN d.item_id IS NOT NULL THEN 'device'
                  WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
                  ELSE 'book' END AS media_type
      FROM transaction t
      JOIN user u ON u.user_id = t.user_id
      JOIN copy c ON c.copy_id = t.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE t.type = 'checkout_request'
    `;
    const [loanRows] = await pool.query(sqlLoan);
    let txRows = [];
    try { const r = await pool.query(sqlTx); txRows = r[0] || []; } catch {}
    const merged = [...loanRows, ...txRows].sort((a,b)=> new Date(b.request_date) - new Date(a.request_date)).slice(0,500);
    return sendJSON(res, 200, { rows: merged });
  } catch (err) {
    console.error("list pending failed:", err.message);
    return sendJSON(res, 500, { error: "pending_list_failed" });
  }
};

// Staff: approve a checkout request and create a real loan
export const approveCheckout = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, 'staff'); if (!auth) return;
  const b = await readJSONBody(req);
  const loan_id = Number(b.loan_id || 0);
  const transaction_id = Number(b.transaction_id || 0);
  if (!loan_id && !transaction_id) return sendJSON(res, 400, { error: 'invalid_payload', message: 'loan_id or transaction_id required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (loan_id) {
      const [rows] = await conn.query(`SELECT loan_id, user_id, copy_id, status FROM loan WHERE loan_id = ? FOR UPDATE`, [loan_id]);
      if (!rows.length || rows[0].status !== 'pending') {
        await conn.rollback();
        return sendJSON(res, 404, { error: 'not_found' });
      }
      const copy_id = rows[0].copy_id;
      await conn.execute(`UPDATE loan SET status='active', checkout_date = NOW() WHERE loan_id = ?`, [loan_id]);
      await conn.execute(`UPDATE copy SET status='on_loan' WHERE copy_id = ?`, [copy_id]);
      await conn.commit();
      return sendJSON(res, 200, { ok: true, loan_id });
    } else {
      // transaction-based approval → create a real loan via helper
      const [trows] = await conn.query(`SELECT transaction_id, user_id, copy_id FROM transaction WHERE transaction_id = ? FOR UPDATE`, [transaction_id]);
      if (!trows.length) { await conn.rollback(); return sendJSON(res, 404, { error: 'not_found' }); }
      const user_id = trows[0].user_id; const copy_id = trows[0].copy_id;
      await conn.commit();
      const result = await performCheckout({ user_id, copy_id, barcode: '', employee_id: null });
      try { await pool.query(`UPDATE transaction SET type='checkout_approved', loan_id=? WHERE transaction_id=?`, [result.loan_id, transaction_id]); } catch {}
      return sendJSON(res, 200, { ok: true, loan_id: result.loan_id });
    }
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('approve checkout failed:', err.message);
    return sendJSON(res, 500, { error: 'approve_failed' });
  } finally {
    conn.release();
  }
};

// Staff: reject a pending request
export const rejectCheckout = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, 'staff'); if (!auth) return;
  const b = await readJSONBody(req);
  const loan_id = Number(b.loan_id || 0);
  const transaction_id = Number(b.transaction_id || 0);
  if (!loan_id && !transaction_id) return sendJSON(res, 400, { error: 'invalid_payload', message: 'loan_id or transaction_id required' });
  try {
    if (loan_id) {
      const [resu] = await pool.query(`UPDATE loan SET status='rejected' WHERE loan_id = ? AND status = 'pending'`, [loan_id]);
      if (!resu.affectedRows) return sendJSON(res, 404, { error: 'not_found' });
      return sendJSON(res, 200, { ok: true });
    } else {
      try { await pool.query(`UPDATE transaction SET type='checkout_rejected' WHERE transaction_id=? AND type='checkout_request'`, [transaction_id]); } catch {}
      return sendJSON(res, 200, { ok: true });
    }
  } catch (err) {
    console.error('reject checkout failed:', err.message);
    return sendJSON(res, 500, { error: 'reject_failed' });
  }
};

export const returnLoan = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); 
  if (!auth) return;
  
  const b = await readJSONBody(req);
  const loan_id = Number(b.loan_id);
  const employee_id = Number(b.employee_id) || null;
  
  if (!loan_id || loan_id <= 0) {
    return sendJSON(res, 400, { error: "invalid_payload", message: "Valid loan ID is required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if loan exists and is active
    const [loanRows] = await conn.query(
      "SELECT loan_id, copy_id, status, return_date FROM loan WHERE loan_id = ?",
      [loan_id]
    );

    if (loanRows.length === 0) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "loan_not_found", message: "Loan not found" });
    }

    const loan = loanRows[0];

    if (loan.return_date !== null) {
      await conn.rollback();
      return sendJSON(res, 400, { error: "already_returned", message: "This loan has already been returned" });
    }

    // Update loan with return date and status
    // Note: employee_id field stores who checked it out, not who processed return
    await conn.execute(
      "UPDATE loan SET return_date = NOW(), status = 'returned' WHERE loan_id = ?",
      [loan_id]
    );

    // Update copy status back to available
    await conn.execute(
      "UPDATE copy SET status = 'available' WHERE copy_id = ?",
      [loan.copy_id]
    );

    await conn.commit();
    return sendJSON(res, 200, { ok: true, message: "Loan returned successfully" });
    
  } catch (err) {
    try { await conn.rollback(); } catch {}
    // Improved diagnostics for production
    const safe = {
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
      message: err?.message,
      loan_id,
    };
    console.error("Return loan error diagnostics:", safe);
    return sendJSON(res, 500, { error: "return_failed", message: err?.message || "unknown_error" });
  } finally {
    conn.release();
  }
};

// List loans for the current authenticated user (student or staff viewing their own)
export const listMyLoans = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const userId = Number(auth.uid || auth.user_id || auth.userId || 0);
  if (!userId) return sendJSON(res, 400, { error: "invalid_user" });

  try {
    const sql = `
      SELECT
        l.loan_id,
        l.user_id,
        l.copy_id,
        l.checkout_date,
        l.due_date,
        l.status,
        i.title AS item_title,
        c.barcode AS copy_barcode,
        COALESCE(l.daily_fine_rate_snapshot, fp.daily_rate) AS daily_rate,
        COALESCE(l.grace_days_snapshot, fp.grace_days) AS grace_days,
        COALESCE(l.max_fine_snapshot, fp.max_fine) AS max_fine,
        CASE
          WHEN d.item_id IS NOT NULL THEN 'device'
          WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
          ELSE 'book'
        END AS media_type
      FROM loan l
      JOIN copy c ON c.copy_id = l.copy_id
      JOIN item i ON i.item_id = c.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      LEFT JOIN fine_policy fp ON fp.media_type = (
          CASE WHEN d.item_id IS NOT NULL THEN 'device'
               WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
               ELSE 'book' END
        ) AND fp.user_category = (SELECT CASE WHEN EXISTS(SELECT 1 FROM account a WHERE a.user_id = l.user_id AND a.role = 'faculty') THEN 'faculty' ELSE 'student' END)
      WHERE l.user_id = ?
      ORDER BY l.status ASC, l.due_date ASC, l.loan_id DESC
      LIMIT 500
    `;
    const [rows] = await pool.query(sql, [userId]);
    return sendJSON(res, 200, { rows });
  } catch (err) {
    console.error("Failed to list my loans:", err.message);
    return sendJSON(res, 500, { error: "my_loans_query_failed" });
  }
};

async function performCheckout({ user_id, copy_id, barcode, employee_id }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [userRows] = await conn.query(
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
      [user_id]
    );
    if (!userRows.length) {
      throw createAppError("user_not_found", "User not found.", 404);
    }
    const accountRole = (userRows[0]?.account_role || "student").toLowerCase();
    const isFaculty = accountRole === "faculty";
    const userCategory = isFaculty ? "faculty" : "student";
    const loanLimit = determineLoanLimit(accountRole);

    const [loanCountRows] = await conn.query(
      `
        SELECT COUNT(*) AS active_loans
        FROM loan
        WHERE user_id = ? AND status = 'active'
      `,
      [user_id]
    );
    const activeLoans = Number(loanCountRows[0]?.active_loans ?? 0);
    if (activeLoans >= loanLimit) {
      throw createAppError(
        "loan_limit_exceeded",
        `Patron already has ${activeLoans} active loan(s); limit is ${loanLimit}.`,
        409
      );
    }

    let resolvedCopyId = Number(copy_id) || null;
    let copy = null;
    if (!resolvedCopyId && barcode) {
      const [copyLookup] = await conn.query(
        `
          SELECT copy_id, status, item_id
          FROM copy
          WHERE barcode = ?
          FOR UPDATE
        `,
        [barcode]
      );
      if (!copyLookup.length) {
        throw createAppError("copy_not_found", "Copy barcode not found.", 404);
      }
      resolvedCopyId = Number(copyLookup[0].copy_id);
      copy = copyLookup[0];
    }

    if (!resolvedCopyId) {
      throw createAppError("invalid_payload", "Copy identifier is required.", 400);
    }

    if (!copy) {
      const [copyRows] = await conn.query(
        `
          SELECT c.copy_id, c.status, c.item_id
          FROM copy c
          WHERE c.copy_id = ?
          FOR UPDATE
        `,
        [resolvedCopyId]
      );
      if (!copyRows.length) {
        throw createAppError("copy_not_found", "Copy not found.", 404);
      }
      copy = copyRows[0];
    }
    if (copy.status !== "available") {
      throw createAppError(
        "copy_not_available", 
        `Copy is not currently available for checkout. Current status: ${copy.status}`, 
        409
      );
    }

    const policy = await resolvePolicy(conn, copy.item_id, userCategory);
    const loanDays = Number(policy?.loan_days) || defaultLoanDays(accountRole);
    const dueDate = getDueDateISO(loanDays);

    let insertResult;
    try {
      // Preferred: insert with policy + snapshot columns
      const [res] = await conn.execute(
        `
          INSERT INTO loan (
            user_id,
            copy_id,
            employee_id,
            policy_id,
            checkout_date,
            due_date,
            status,
            daily_fine_rate_snapshot,
            grace_days_snapshot,
            max_fine_snapshot,
            replacement_fee_snapshot
          )
          VALUES (
            ?, ?, ?, ?, NOW(), ?, 'active', ?, ?, ?, ?
          )
        `,
        [
          user_id,
          resolvedCopyId,
          employee_id,
          policy?.policy_id ?? null,
          dueDate,
          policy?.daily_rate ?? null,
          policy?.grace_days ?? null,
          policy?.max_fine ?? null,
          policy?.replacement_fee ?? null,
        ]
      );
      insertResult = res;
    } catch (e) {
      // Fallback for legacy schemas without policy/snapshot columns
      const msg = String(e?.message || "");
      if (e?.code === 'ER_BAD_FIELD_ERROR' || /Unknown column/.test(msg)) {
        const [res] = await conn.execute(
          `
            INSERT INTO loan (
              user_id,
              copy_id,
              employee_id,
              checkout_date,
              due_date,
              status
            ) VALUES (
              ?, ?, ?, NOW(), ?, 'active'
            )
          `,
          [user_id, resolvedCopyId, employee_id, dueDate]
        );
        insertResult = res;
      } else {
        throw e;
      }
    }

    await conn.execute(
      "UPDATE copy SET status='on_loan' WHERE copy_id=?",
      [resolvedCopyId]
    );

    await conn.commit();

    return {
      loan_id: insertResult.insertId,
      due_date: dueDate,
      policy,
    };
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

function createAppError(appCode, message, status = 400) {
  const err = new Error(message);
  err.appCode = appCode;
  err.status = status;
  return err;
}

async function resolvePolicy(conn, item_id, userCategory) {
  const [itemTypeRows] = await conn.query(
    `
      SELECT
        CASE
          WHEN d.item_id IS NOT NULL THEN 'device'
          WHEN md.item_id IS NOT NULL THEN LOWER(md.media_type)
          ELSE 'book'
        END AS raw_media_type
      FROM item i
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media md ON md.item_id = i.item_id
      WHERE i.item_id = ?
      LIMIT 1
    `,
    [item_id]
  );
  const rawMediaType = itemTypeRows[0]?.raw_media_type || "book";
  const policyMediaType = normalizePolicyMediaType(rawMediaType);

  if (!policyMediaType) return null;
  try {
    const [policyRows] = await conn.query(
      `
        SELECT policy_id, media_type, loan_days, daily_rate, grace_days, max_fine, replacement_fee
        FROM fine_policy
        WHERE media_type = ? AND user_category = ?
        LIMIT 1
      `,
      [policyMediaType, userCategory]
    );
    if (policyRows.length) return policyRows[0];

    if (policyMediaType !== "other") {
      const [fallbackRows] = await conn.query(
        `
          SELECT policy_id, media_type, loan_days, daily_rate, grace_days, max_fine, replacement_fee
          FROM fine_policy
          WHERE media_type = 'other' AND user_category = ?
          LIMIT 1
        `,
        [userCategory]
      );
      if (fallbackRows.length) return fallbackRows[0];
    }
  } catch (err) {
    // Make fine_policy optional: if the table is missing, proceed without a policy
    if (err && (err.code === 'ER_NO_SUCH_TABLE' || /fine_policy/.test(String(err.message)))) {
      return { media_type: policyMediaType };
    }
    throw err;
  }

  return { media_type: policyMediaType };
}

function normalizePolicyMediaType(raw) {
  const value = (raw || "").toLowerCase();
  if (!value) return "book";
  if (value === "device") return "device";
  if (value === "dvd") return "dvd";
  if (value === "blu-ray" || value === "bluray") return "dvd";
  if (value === "cd") return "other";
  if (value === "book") return "book";
  if (value === "other") return "other";
  return "book";
}

function getDueDateISO(days) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() + (Number.isFinite(days) ? days : 14));
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function determineLoanLimit(role) {
  const normalized = (role || "").toLowerCase();
  if (normalized === "faculty") return 7;
  return 5;
}

function defaultLoanDays(role) {
  const normalized = (role || "").toLowerCase();
  if (normalized === "faculty") return 21;
  return 14;
}

export const fetchUserLoans = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const userId = Number(auth.uid || auth.user_id || auth.userId || 0);
  if (!userId) return sendJSON(res, 400, { error: "invalid_user" });

  try {
    // Include outstanding fine totals per loan so the UI can surface what each borrower still owes.
    const sql = `
      SELECT 
        l.loan_id,
        i.title AS item_title,
        l.due_date,
        l.return_date,
        l.status,
        COALESCE(fines.outstanding_amount, 0) AS outstanding_fine
      FROM user u
      INNER JOIN loan l ON l.user_id = u.user_id
      INNER JOIN copy c ON c.copy_id = l.copy_id
      INNER JOIN item i ON i.item_id = c.item_id
      LEFT JOIN (
        SELECT
          f.loan_id,
          SUM(
            GREATEST(
              COALESCE(f.amount_assessed, 0) - COALESCE(pay.paid_total, 0),
              0
            )
          ) AS outstanding_amount
        FROM fine f
        LEFT JOIN (
          SELECT
            fine_id,
            SUM(
              CASE 
                WHEN type = 'refund' THEN -COALESCE(amount, 0)
                ELSE COALESCE(amount, 0)
              END
            ) AS paid_total
          FROM fine_payment
          GROUP BY fine_id
        ) pay ON pay.fine_id = f.fine_id
        WHERE f.status NOT IN ('paid', 'waived', 'written_off')
        GROUP BY f.loan_id
      ) fines ON fines.loan_id = l.loan_id
      WHERE u.user_id = ?
      ORDER BY
        CASE
          WHEN l.return_date IS NULL AND l.due_date < NOW() THEN 1
          WHEN l.return_date IS NULL AND l.due_date >= NOW() THEN 2
          WHEN l.return_date IS NOT NULL THEN 3
        END,
        l.due_date ASC
      LIMIT 50
    `;
    const [rows] = await pool.query(sql, [userId]);
    return sendJSON(res, 200, { rows });
  } catch (err) {
      console.error("Failed to list user loans:", err.message);
      return sendJSON(res, 500, { error: "user_loans_query_failed" });
  }
};
