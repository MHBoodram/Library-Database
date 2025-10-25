import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendJSON, readJSONBody } from "../lib/http.js";
import { pool } from "../lib/db.js";

export function register() {
  return async (req, res) => {
    const b = await readJSONBody(req);
    const first = (b.first_name||"").trim();
    const last  = (b.last_name||"").trim();
    const email = (b.email||"").trim().toLowerCase();
    const password = b.password || "";
    const role = "student";
    if (!first || !last || !email || !password) return sendJSON(res, 400, { error:"missing_fields" });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [u] = await conn.execute(
        "INSERT INTO user(first_name,last_name,email,joined_at) VALUES(?,?,?,CURDATE())",
        [first,last,email]
      );
      const hash = await bcrypt.hash(password, 10);
      await conn.execute(
        "INSERT INTO account(user_id,email,password_hash,role) VALUES(?,?,?,?)",
        [u.insertId, email, hash, role]
      );
      await conn.commit();
      return sendJSON(res, 201, { user_id: u.insertId, email, role });
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
    const { email="", password="" } = await readJSONBody(req);
    const [rows] = await pool.execute(
      "SELECT a.account_id,a.user_id,a.email,a.password_hash,a.role,a.is_active,u.first_name,u.last_name \
       FROM account a JOIN user u ON u.user_id=a.user_id WHERE a.email=?",
      [email.toLowerCase()]
    );
    const acc = rows[0];
    if (!acc || !acc.is_active) return sendJSON(res, 401, { error:"invalid_login" });
    const ok = await bcrypt.compare(password, acc.password_hash);
    if (!ok) return sendJSON(res, 401, { error:"invalid_login" });
    const token = jwt.sign({ user_id: acc.user_id, role: acc.role, email: acc.email }, JWT_SECRET, { expiresIn:"8h" });
    return sendJSON(res, 200, { token, user: { user_id: acc.user_id, name: acc.first_name+" "+acc.last_name, role: acc.role, email: acc.email } });
  };
}

export function me(JWT_SECRET) {
  return async (req, res) => {
    // simple echo of the JWT (index wires requireAuth if you want)
    return sendJSON(res, 200, { ok: true });
  };
}
