import { sendJSON, readJSONBody, requireEmployeeRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

const SEARCH_MODES = ["all", "fullname", "firstname", "lastname", "email", "id"];
const ACCOUNT_ROLES = ["student", "faculty", "staff", "admin"];
const EMPLOYEE_ROLES = ["librarian", "clerk", "assistant", "admin"];

const toIso = (value) => (value ? new Date(value).toISOString() : null);
const toIsoDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : null);

function normalizeRow(row) {
  return {
    account_id: row.account_id,
    user_id: row.user_id,
    employee_id: row.employee_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    date_of_birth: toIsoDate(row.date_of_birth),
    role: row.role,
    employee_role: row.employee_role,
    is_active: Boolean(row.is_active),
    created_at: toIso(row.created_at),
    flagged_for_deletion: Boolean(row.flagged_for_deletion),
    flagged_at: toIso(row.flagged_at),
    flagged_by_account_id: row.flagged_by_account_id,
  };
}

async function fetchAccountById(conn, accountId) {
  const [rows] = await conn.execute(
    `
    SELECT
      a.account_id,
      a.user_id,
      a.employee_id,
      a.email,
      a.role,
      a.is_active,
      a.created_at,
      a.flagged_for_deletion,
      a.flagged_at,
      a.flagged_by_account_id,
      u.first_name,
      u.last_name,
      u.phone,
      u.address,
      u.date_of_birth,
      e.role AS employee_role
    FROM account a
    JOIN user u ON u.user_id = a.user_id
    LEFT JOIN employee e ON e.employee_id = a.employee_id
    WHERE a.account_id = ?
    LIMIT 1
    `,
    [accountId]
  );
  return rows[0] || null;
}

export const listAccounts = (JWT_SECRET) => async (req, res) => {
  const admin = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const rawMode = (url.searchParams.get("mode") || "all").toLowerCase();
  const mode = SEARCH_MODES.includes(rawMode) ? rawMode : "all";
  const term = (url.searchParams.get("term") || "").trim();

  const where = [];
  const params = [];

  if (term) {
    switch (mode) {
      case "fullname":
        where.push("CONCAT(u.first_name, ' ', u.last_name) LIKE ?");
        params.push(`%${term}%`);
        break;
      case "firstname":
        where.push("u.first_name LIKE ?");
        params.push(`%${term}%`);
        break;
      case "lastname":
        where.push("u.last_name LIKE ?");
        params.push(`%${term}%`);
        break;
      case "email":
        where.push("a.email LIKE ?");
        params.push(`%${term}%`);
        break;
      case "id":
        where.push("u.user_id = ?");
        params.push(Number(term) || -1);
        break;
      case "all":
      default:
        where.push(
          "(CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR a.email LIKE ? OR u.user_id LIKE ?)"
        );
        params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, Number(term) || -1);
        break;
    }
  }

  const whereLine = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `
      SELECT
        a.account_id,
        a.user_id,
        a.employee_id,
        a.email,
        a.role,
        a.is_active,
        a.created_at,
        a.flagged_for_deletion,
        a.flagged_at,
        a.flagged_by_account_id,
        u.first_name,
        u.last_name,
        u.phone,
        u.address,
        u.date_of_birth,
        e.role AS employee_role
      FROM user u
      JOIN account a ON u.user_id = a.user_id
      LEFT JOIN employee e ON e.employee_id = a.employee_id
      ${whereLine}
      ORDER BY a.created_at DESC
      LIMIT 500
      `,
      params
    );

    return sendJSON(res, 200, rows.map(normalizeRow));
  } catch (err) {
    console.error("Failed to list accounts:", err.message);
    return sendJSON(res, 500, { error: "list_accounts_failed" });
  }
};

export const updateAccount = (JWT_SECRET) => async (req, res, params) => {
  const admin = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!admin) return;

  const accountId = Number(params?.id);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return sendJSON(res, 400, { error: "invalid_account" });
  }

  const body = await readJSONBody(req);
  const firstName = typeof body.first_name === "string" ? body.first_name.trim() : undefined;
  const lastName = typeof body.last_name === "string" ? body.last_name.trim() : undefined;
  const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : undefined;
  const employeeRole = typeof body.employee_role === "string" ? body.employee_role.trim().toLowerCase() : undefined;
  const isActiveRaw = body.is_active;
  const hasIsActive = typeof isActiveRaw !== "undefined";
  const isActive = hasIsActive ? (isActiveRaw === true || isActiveRaw === 1 || isActiveRaw === "1" || isActiveRaw === "true") : undefined;
  const hasPhone = Object.prototype.hasOwnProperty.call(body, "phone");
  const phoneValue = hasPhone && typeof body.phone === "string" ? body.phone.trim() : hasPhone ? "" : undefined;
  const phone = typeof phoneValue === "undefined" ? undefined : (phoneValue || null);
  const hasAddress = Object.prototype.hasOwnProperty.call(body, "address");
  const addressValue = hasAddress && typeof body.address === "string" ? body.address.trim() : hasAddress ? "" : undefined;
  const address = typeof addressValue === "undefined" ? undefined : (addressValue || null);
  const hasDob = Object.prototype.hasOwnProperty.call(body, "date_of_birth");
  let dateOfBirth;
  if (hasDob) {
    const dobRaw = typeof body.date_of_birth === "string" ? body.date_of_birth.trim() : "";
    if (dobRaw && !/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
      return sendJSON(res, 400, { error: "invalid_date_of_birth" });
    }
    dateOfBirth = dobRaw || null;
  }

  if (
    !firstName &&
    !lastName &&
    typeof role === "undefined" &&
    !hasIsActive &&
    typeof employeeRole === "undefined" &&
    !hasPhone &&
    !hasAddress &&
    !hasDob
  ) {
    return sendJSON(res, 400, { error: "no_changes" });
  }

  if (role && !ACCOUNT_ROLES.includes(role)) {
    return sendJSON(res, 400, { error: "invalid_role" });
  }
  if (employeeRole && !EMPLOYEE_ROLES.includes(employeeRole)) {
    return sendJSON(res, 400, { error: "invalid_employee_role" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const account = await fetchAccountById(conn, accountId);
    if (!account) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "account_not_found" });
    }

    const userUpdates = [];
    const userParams = [];
    if (firstName) {
      userUpdates.push("first_name = ?");
      userParams.push(firstName);
    }
    if (lastName) {
      userUpdates.push("last_name = ?");
      userParams.push(lastName);
    }
    if (typeof phone !== "undefined") {
      userUpdates.push("phone = ?");
      userParams.push(phone);
    }
    if (typeof address !== "undefined") {
      userUpdates.push("address = ?");
      userParams.push(address);
    }
    if (typeof dateOfBirth !== "undefined") {
      userUpdates.push("date_of_birth = ?");
      userParams.push(dateOfBirth);
    }
    if (userUpdates.length) {
      userParams.push(account.user_id);
      await conn.execute(`UPDATE user SET ${userUpdates.join(", ")} WHERE user_id = ?`, userParams);
    }

    if ((firstName || lastName) && account.employee_id) {
      const empUpdates = [];
      const empParams = [];
      if (firstName) {
        empUpdates.push("first_name = ?");
        empParams.push(firstName);
      }
      if (lastName) {
        empUpdates.push("last_name = ?");
        empParams.push(lastName);
      }
      if (empUpdates.length) {
        empParams.push(account.employee_id);
        await conn.execute(`UPDATE employee SET ${empUpdates.join(", ")} WHERE employee_id = ?`, empParams);
      }
    }

    const accountUpdates = [];
    const accountParams = [];
    if (role) {
      accountUpdates.push("role = ?");
      accountParams.push(role);
    }
    if (hasIsActive) {
      accountUpdates.push("is_active = ?");
      accountParams.push(isActive ? 1 : 0);
    }
    if (accountUpdates.length) {
      accountParams.push(accountId);
      await conn.execute(`UPDATE account SET ${accountUpdates.join(", ")} WHERE account_id = ?`, accountParams);
    }

    if (employeeRole) {
      if (!account.employee_id) {
        await conn.rollback();
        return sendJSON(res, 400, { error: "no_employee_record" });
      }
      await conn.execute("UPDATE employee SET role = ? WHERE employee_id = ?", [employeeRole, account.employee_id]);
    }

    await conn.commit();

    const refreshed = await fetchAccountById(conn, accountId);
    return sendJSON(res, 200, { account: normalizeRow(refreshed) });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to update account:", err.message);
    return sendJSON(res, 500, { error: "update_account_failed" });
  } finally {
    conn.release();
  }
};

export const flagAccount = (JWT_SECRET) => async (req, res, params) => {
  const admin = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!admin) return;

  const accountId = Number(params?.id);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return sendJSON(res, 400, { error: "invalid_account" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `UPDATE account
       SET flagged_for_deletion = 1,
           flagged_at = NOW(),
           flagged_by_account_id = ?
       WHERE account_id = ?`,
      [admin.sub, accountId]
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "account_not_found" });
    }

    await conn.commit();
    const refreshed = await fetchAccountById(conn, accountId);
    return sendJSON(res, 200, { account: normalizeRow(refreshed) });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to flag account:", err.message);
    return sendJSON(res, 500, { error: "flag_account_failed" });
  } finally {
    conn.release();
  }
};
