import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendJSON, readJSONBody } from "../lib/http.js";
import { pool } from "../lib/db.js";

export function login(JWT_SECRET) {
  return async (req, res) => {
    const { email = "", password = "" } = await readJSONBody(req);
    if (!email || !password) return sendJSON(res, 400, { error: "missing_fields" });

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `
        SELECT
          a.account_id,
          a.user_id,
          a.email,
          a.password_hash,
          a.is_active,
          a.flagged_for_deletion,
          a.employee_id,               -- from account
          a.role,
          u.first_name,
          u.last_name,
          u.email AS user_email,
          u.phone,
          u.address,
          e.role AS employee_role
        FROM account a
        JOIN user u ON u.user_id = a.user_id
        LEFT JOIN employee e ON e.employee_id = a.employee_id
        WHERE a.email = ?
        `,
        [email.toLowerCase()]
      );

      if (rows.length === 0) return sendJSON(res, 401, { error: "invalid_login" });

      const acc = rows[0];
      const ok = await bcrypt.compare(password, acc.password_hash);
      if (!ok) return sendJSON(res, 401, { error: "invalid_login" });

      const isActive = Number(acc.is_active) === 1;
      const flaggedForDeletion = Number(acc.flagged_for_deletion) === 1;

      // Hard block: flagged for deletion AND inactive => cannot log in at all
      if (!isActive && flaggedForDeletion) {
        return sendJSON(res, 403, { error: "Account unavailable" });
      }

      const isStaff = Boolean(acc.employee_id);
      const employeeRole = acc.employee_role || null;
      const role = isStaff ? "staff" : acc.role || "student";
      const name = [acc.first_name, acc.last_name].filter(Boolean).join(" ").trim();
      const locked = !isActive && !flaggedForDeletion;

      const token = jwt.sign(
        {
          sub: acc.account_id,
          uid: acc.user_id,
          email: acc.email,
          role,
          employee_id: acc.employee_id,
          employee_role: employeeRole,
          locked,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return sendJSON(res, 200, {
        token,
        user: {
          account_id: acc.account_id,
          user_id: acc.user_id,
          first_name: acc.first_name,
          last_name: acc.last_name,
          email: acc.email,
          role,
          employee_id: acc.employee_id,
          employee_role: employeeRole,
          is_admin: employeeRole === "admin",
          locked,
          phone: acc.phone,
          address: acc.address,
          name: name || acc.email,
        },
      });
    } catch (err) {
      console.error("Login error:", err.message);
      return sendJSON(res, 500, { error: "internal_error" });
    } finally {
      conn.release();
    }
  };
}




export function me(JWT_SECRET) {
  return async (req, res) => {
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return sendJSON(res, 401, { error: "unauthorized" });

      const decoded = jwt.verify(token, JWT_SECRET);
      // decoded contains { sub, uid, email, role, is_employee, iat, exp }
      return sendJSON(res, 200, { user: decoded });
    } catch {
      return sendJSON(res, 401, { error: "unauthorized" });
    }
  };
}
