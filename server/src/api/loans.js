import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const checkout = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const user_id = Number(b.user_id || auth.user_id);
  const copy_id = Number(b.copy_id);
  const employee_id = Number(b.employee_id) || null;
  if (!user_id || !copy_id) return sendJSON(res, 400, { error:"invalid_payload" });

  try {
    const result = await performCheckout({ user_id, copy_id, employee_id });
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
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const loan_id = Number(b.loan_id);
  const employee_id = Number(b.employee_id) || null;
  if (!loan_id) return sendJSON(res, 400, { error:"invalid_payload" });

  await pool.query("CALL sp_return(?,?)", [loan_id, employee_id]);
  return sendJSON(res, 200, { ok:true });
};

async function performCheckout({ user_id, copy_id, employee_id }) {
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

    const [copyRows] = await conn.query(
      `
        SELECT c.status, c.item_id
        FROM copy c
        WHERE c.copy_id = ?
        FOR UPDATE
      `,
      [copy_id]
    );
    if (!copyRows.length) {
      throw createAppError("copy_not_found", "Copy not found.", 404);
    }
    const copy = copyRows[0];
    if (copy.status !== "available") {
      throw createAppError("copy_not_available", "Copy is not currently available for checkout.", 409);
    }

    const policy = await resolvePolicy(conn, copy.item_id, userCategory);
    const loanDays = Number(policy?.loan_days) || defaultLoanDays(accountRole);
    const dueDate = getDueDateISO(loanDays);

    const [insertResult] = await conn.execute(
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
        copy_id,
        employee_id,
        policy?.policy_id ?? null,
        dueDate,
        policy?.daily_rate ?? null,
        policy?.grace_days ?? null,
        policy?.max_fine ?? null,
        policy?.replacement_fee ?? null,
      ]
    );

    await conn.execute(
      "UPDATE copy SET status='on_loan' WHERE copy_id=?",
      [copy_id]
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
