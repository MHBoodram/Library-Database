import { sendJSON, requireEmployeeRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

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
         COALESCE(SUM(amount), 0) AS open_fine_amount
       FROM fine
       WHERE LOWER(status) NOT IN ('paid','waived')`
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
