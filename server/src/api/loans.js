import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const checkout = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = Number(b.user_id || auth.user_id || auth.uid || auth.userId);
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
    console.error("Return loan error:", err);
    return sendJSON(res, 500, { error: "return_failed", message: err.message });
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
    const sql = `
    SELECT i.title AS item_title , l.due_date, l.return_date, l.status
    FROM user u
    INNER JOIN loan l ON l.user_id = u.user_id
    INNER JOIN copy c ON c.copy_id = l.copy_id
    INNER JOIN item i ON i.item_id = c.item_id
    WHERE u.user_id = ?
    ORDER BY
      CASE
        WHEN l.return_date IS NULL and l.due_date < NOW() THEN 1
        WHEN l.return_date IS NULL and l.due_date >= NOW() THEN 2
        WHEN l.return_date IS NOT NULL THEN 3
      END,
      l.due_date ASC
    LIMIT 50
    `
    const [rows] = await pool.query(sql, [userId]);
    return sendJSON(res, 200, { rows });
    }catch (err) {
      console.error("Failed to list user loans:", err.message);
      return sendJSON(res, 500, { error: "user_loans_query_failed" });
  }
};
