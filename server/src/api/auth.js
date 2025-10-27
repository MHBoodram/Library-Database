import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendJSON, readJSONBody } from "../lib/http.js";
import { pool } from "../lib/db.js";

export function register() {
  return async (req, res) => {
    const b = await readJSONBody(req);
    const first = (b.first_name || "").trim();
    const last = (b.last_name || "").trim();
    const email = (b.email || "").trim().toLowerCase();
    const password = b.password || "";
    const makeEmployee = (() => {
      const raw = b.make_employee;
      if (typeof raw === "boolean") return raw;
      if (typeof raw === "number") return raw === 1;
      if (typeof raw === "string") {
        const normalized = raw.trim().toLowerCase();
        return ["1", "true", "yes", "on"].includes(normalized);
      }
      return false;
    })();
    const role = makeEmployee ? "staff" : "student";
    if (!first || !last || !email || !password) return sendJSON(res, 400, { error:"missing_fields" });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [u] = await conn.execute(
        "INSERT INTO user(first_name,last_name,email,joined_at) VALUES(?,?,?,CURDATE())",
        [first,last,email]
      );
      const hash = await bcrypt.hash(password, 10);
      let employeeId = null;
      if (makeEmployee) {
        const [employee] = await conn.execute(
          "INSERT INTO employee(first_name,last_name,role,hire_date) VALUES(?,?,?,CURDATE())",
          [first, last, "assistant"]
        );
        employeeId = employee.insertId;
      }
      await conn.execute(
        "INSERT INTO account(user_id,employee_id,email,password_hash,role) VALUES(?,?,?,?,?)",
        [u.insertId, employeeId, email, hash, role]
      );
      await conn.commit();
      return sendJSON(res, 201, { user_id: u.insertId, email, role, employee_id: employeeId });
    } catch (e) {
      try { await conn.rollback(); } catch {}
      return sendJSON(res, 400, { error:"register_failed", details:e.message });
    } finally {
      conn.release();
    }
  };
}

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
          a.employee_id,               -- from account
          a.role,
          u.first_name,
          u.last_name,
          u.email AS user_email
        FROM account a
        JOIN user u ON u.user_id = a.user_id
        LEFT JOIN employee e ON e.employee_id = a.employee_id
        WHERE a.email = ?
        `,
        [email.toLowerCase()]
      );

      if (rows.length === 0) return sendJSON(res, 401, { error: "invalid_login" });

      const acc = rows[0];
      if (!Number(acc.is_active)) return sendJSON(res, 403, { error: "account_inactive" });

      const ok = await bcrypt.compare(password, acc.password_hash);
      if (!ok) return sendJSON(res, 401, { error: "invalid_login" });

      const isStaff = Boolean(acc.employee_id);
      const role = isStaff ? "staff" : acc.role || "student";
      const name = [acc.first_name, acc.last_name].filter(Boolean).join(" ").trim();

      const token = jwt.sign(
        {
          sub: acc.account_id,
          uid: acc.user_id,
          email: acc.email,
          role,
          employee_id: acc.employee_id,
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
