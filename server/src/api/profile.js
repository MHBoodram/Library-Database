import bcrypt from "bcryptjs";
import { requireAuth, sendJSON, readJSONBody } from "../lib/http.js";
import { pool } from "../lib/db.js";

const MIN_PASSWORD_LENGTH = 8;

export const getProfile = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;

  try {
    const [rows] = await pool.execute(
      `SELECT
         a.account_id,
         a.user_id,
         a.email,
         a.employee_id,
         a.role,
         u.first_name,
         u.last_name,
         u.phone,
         u.address,
         e.role AS employee_role
       FROM account a
       JOIN user u ON u.user_id = a.user_id
       LEFT JOIN employee e ON e.employee_id = a.employee_id
       WHERE a.account_id = ?
       LIMIT 1`,
      [auth.sub]
    );

    if (!rows.length) return sendJSON(res, 404, { error: "account_missing" });

    const row = rows[0];
    return sendJSON(res, 200, {
      user: {
        account_id: row.account_id,
        user_id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.employee_id ? "staff" : row.role,
        employee_id: row.employee_id,
        employee_role: row.employee_role,
        phone: row.phone,
        address: row.address,
        name: [row.first_name, row.last_name].filter(Boolean).join(" "),
      },
    });
  } catch (err) {
    console.error("Failed to fetch profile:", err.message);
    return sendJSON(res, 500, { error: "profile_fetch_failed" });
  }
};

export const updateProfile = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;

  const body = await readJSONBody(req);
  const first = typeof body.first_name === "string" ? body.first_name.trim() : null;
  const last = typeof body.last_name === "string" ? body.last_name.trim() : null;
  const phoneRaw = Object.prototype.hasOwnProperty.call(body, "phone")
    ? typeof body.phone === "string" ? body.phone.trim() : ""
    : undefined;
  const phone = typeof phoneRaw === "undefined" ? undefined : (phoneRaw || null);
  const addressRaw = Object.prototype.hasOwnProperty.call(body, "address")
    ? typeof body.address === "string" ? body.address.trim() : ""
    : undefined;
  const address = typeof addressRaw === "undefined" ? undefined : (addressRaw || null);
  const currentPassword = body.current_password || "";
  const newPassword = body.new_password || "";

  if (!first && !last && !newPassword && typeof phone === "undefined" && typeof address === "undefined") {
    return sendJSON(res, 400, { error: "no_changes" });
  }

  if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
    return sendJSON(res, 400, { error: "password_too_short" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [accounts] = await conn.execute(
      `SELECT a.account_id, a.user_id, a.password_hash
       FROM account a
       WHERE a.account_id = ?
       LIMIT 1`,
      [auth.sub]
    );
    if (!accounts.length) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "account_missing" });
    }

    const account = accounts[0];

    if (newPassword) {
      const ok = await bcrypt.compare(currentPassword || "", account.password_hash || "");
      if (!ok) {
        await conn.rollback();
        return sendJSON(res, 400, { error: "invalid_current_password" });
      }
      const nextHash = await bcrypt.hash(newPassword, 10);
      await conn.execute("UPDATE account SET password_hash=? WHERE account_id=?", [nextHash, account.account_id]);
    }

    if (first || last || typeof phone !== "undefined" || typeof address !== "undefined") {
      const updateFields = [];
      const params = [];
      if (first) { updateFields.push("first_name = ?"); params.push(first); }
      if (last) { updateFields.push("last_name = ?"); params.push(last); }
      if (typeof phone !== "undefined") { updateFields.push("phone = ?"); params.push(phone); }
      if (typeof address !== "undefined") { updateFields.push("address = ?"); params.push(address); }
      if (updateFields.length) {
        params.push(account.user_id);
        await conn.execute(`UPDATE user SET ${updateFields.join(", ")} WHERE user_id = ?`, params);
      }
    }

    await conn.commit();

    const [refetched] = await conn.execute(
      `SELECT
         a.account_id,
         a.user_id,
         a.email,
         a.employee_id,
         a.role,
         u.first_name,
         u.last_name,
         u.phone,
         u.address,
         e.role AS employee_role
       FROM account a
       JOIN user u ON u.user_id = a.user_id
       LEFT JOIN employee e ON e.employee_id = a.employee_id
       WHERE a.account_id = ?
       LIMIT 1`,
      [auth.sub]
    );

    const row = refetched[0];
    return sendJSON(res, 200, {
      user: {
        account_id: row.account_id,
        user_id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.employee_id ? "staff" : row.role,
        employee_id: row.employee_id,
        employee_role: row.employee_role,
        phone: row.phone,
        address: row.address,
        name: [row.first_name, row.last_name].filter(Boolean).join(" "),
      },
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to update profile:", err.message);
    return sendJSON(res, 500, { error: "profile_update_failed" });
  } finally {
    conn.release();
  }
};
