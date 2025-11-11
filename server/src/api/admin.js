import bcrypt from "bcryptjs";
import { sendJSON, requireEmployeeRole, readJSONBody } from "../lib/http.js";
import { pool } from "../lib/db.js";

const EMPLOYEE_ROLES = ["librarian", "clerk", "assistant", "admin"];
const ACCOUNT_ROLES = ["student", "faculty", "staff", "admin"];

export const adminOverview = (JWT_SECRET) => async (req, res) => {
  const auth = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!auth) return;

  try {
    const [roleCounts] = await pool.query(
      `SELECT role, COUNT(*) AS count FROM employee GROUP BY role ORDER BY role`
    );

    const [recentHires] = await pool.query(
      `SELECT employee_id, first_name, last_name, role, hire_date
       FROM employee
       ORDER BY hire_date DESC, employee_id DESC
       LIMIT 10`
    );

    const [[accountStats]] = await pool.query(
      `SELECT
         COUNT(*) AS total_accounts,
         SUM(CASE WHEN employee_id IS NOT NULL THEN 1 ELSE 0 END) AS staff_accounts,
         SUM(CASE WHEN role IN ('student','faculty') THEN 1 ELSE 0 END) AS patron_accounts
       FROM account`
    );

    const [[fineStats]] = await pool.query(
      `SELECT
         COUNT(*) AS open_fines,
         COALESCE(SUM(amount_assessed), 0) AS open_fine_amount
       FROM fine
       WHERE LOWER(status) NOT IN ('paid','waived','written_off')`
    );

    return sendJSON(res, 200, {
      role_counts: roleCounts.map((row) => ({ role: row.role, count: Number(row.count) })),
      recent_hires: recentHires.map((row) => ({
        employee_id: row.employee_id,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
        hire_date: row.hire_date,
      })),
      account_stats: {
        total_accounts: Number(accountStats?.total_accounts || 0),
        staff_accounts: Number(accountStats?.staff_accounts || 0),
        patron_accounts: Number(accountStats?.patron_accounts || 0),
      },
      fine_stats: {
        open_fines: Number(fineStats?.open_fines || 0),
        open_fine_amount: Number(fineStats?.open_fine_amount || 0),
      },
    });
  } catch (err) {
    console.error("Failed to load admin overview:", err.message);
    return sendJSON(res, 500, { error: "admin_overview_failed" });
  }
};

export const listEmployees = (JWT_SECRET) => async (req, res) => {
  const auth = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!auth) return;

  try {
    const [rows] = await pool.query(
      `SELECT
         e.employee_id,
         e.first_name,
         e.last_name,
         e.role,
         e.hire_date,
         a.email
       FROM employee e
       LEFT JOIN account a ON a.employee_id = e.employee_id
       ORDER BY e.hire_date DESC, e.employee_id DESC
       LIMIT 200`
    );

    return sendJSON(res, 200, { rows });
  } catch (err) {
    console.error("Failed to list employees:", err.message);
    return sendJSON(res, 500, { error: "admin_employees_failed" });
  }
};

export const listAccountCreations = (JWT_SECRET) => async (req, res) => {
  const auth = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!auth) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDateParam = (url.searchParams.get("start_date") || "").trim();
    const endDateParam = (url.searchParams.get("end_date") || "").trim();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let startDate = startDateParam;
    let endDate = endDateParam;

    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      startDate = monthAgo.toISOString().slice(0, 10);
    }

    if (new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const [rows] = await pool.query(
      `SELECT
         a.account_id,
         u.user_id,
         u.first_name,
         u.last_name,
         u.email,
         u.joined_at AS created_at,
         a.role AS account_role,
         e.employee_id,
         e.role AS employee_role
       FROM account a
       JOIN user u ON u.user_id = a.user_id
       LEFT JOIN employee e ON e.employee_id = a.employee_id
       WHERE u.joined_at >= ? AND u.joined_at <= ?
       ORDER BY u.joined_at DESC
       LIMIT 500`,
      [startDate, endDate]
    );

    return sendJSON(res, 200, { rows });
  } catch (err) {
    console.error("Failed to list account creations:", err.message);
    return sendJSON(res, 500, { error: "admin_account_creations_failed" });
  }
};

export const createAccount = (JWT_SECRET) => async (req, res) => {
  const auth = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!auth) return;

  const body = await readJSONBody(req);
  const firstName = (body.first_name || "").trim();
  const lastName = (body.last_name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const accountTypeRaw = (body.account_type || "user").toString().toLowerCase();
  const accountType = accountTypeRaw === "employee" ? "employee" : "user";
  const accountRoleRaw = (body.account_role || "student").toString().toLowerCase();
  const accountRole = ACCOUNT_ROLES.includes(accountRoleRaw) ? accountRoleRaw : "student";
  const employeeRoleRaw = (body.employee_role || "").toString().toLowerCase();
  const employeeRole = accountType === "employee" ? employeeRoleRaw : null;

  if (!firstName || !lastName || !email || !password) {
    return sendJSON(res, 400, { error: "missing_fields" });
  }

  if (accountType === "employee" && !EMPLOYEE_ROLES.includes(employeeRole)) {
    return sendJSON(res, 400, { error: "invalid_employee_role" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute(
      "SELECT account_id FROM account WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing.length) {
      await conn.rollback();
      return sendJSON(res, 409, { error: "email_in_use" });
    }

    const [userRow] = await conn.execute(
      "INSERT INTO user(first_name,last_name,email,joined_at) VALUES(?,?,?,CURDATE())",
      [firstName, lastName, email]
    );
    const userId = userRow.insertId;

    let employeeId = null;
    if (accountType === "employee") {
      const [employeeRow] = await conn.execute(
        "INSERT INTO employee(first_name,last_name,role,hire_date) VALUES(?,?,?,CURDATE())",
        [firstName, lastName, employeeRole]
      );
      employeeId = employeeRow.insertId;
    }

    const hash = await bcrypt.hash(password, 10);
    const roleForAccount = accountType === "employee" ? "staff" : accountRole;

    const [accountRow] = await conn.execute(
      "INSERT INTO account(user_id, employee_id, email, password_hash, role, is_active) VALUES(?,?,?,?,?,1)",
      [userId, employeeId, email, hash, roleForAccount]
    );

    await conn.commit();
    return sendJSON(res, 201, {
      account_id: accountRow.insertId,
      user_id: userId,
      employee_id: employeeId,
      email,
      account_type: accountType,
      account_role: roleForAccount,
      employee_role: employeeRole,
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to create admin account:", err.message);
    return sendJSON(res, 500, { error: "admin_account_create_failed" });
  } finally {
    conn.release();
  }
};
