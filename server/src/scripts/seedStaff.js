import "dotenv/config";
import { pool } from "../lib/db.js";
import bcrypt from "bcryptjs";

async function upsertAdmin() {
  // You can change these defaults if desired
  const first_name = process.env.SEED_ADMIN_FIRST || "Staff";
  const last_name = process.env.SEED_ADMIN_LAST || "User";
  const email = process.env.SEED_ADMIN_EMAIL || "staff@library.test";
  const password = process.env.SEED_ADMIN_PASSWORD || "Staff!123";
  const role = "staff";

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if account already exists
    const [accRows] = await conn.execute(
      "SELECT a.account_id, a.user_id FROM account a WHERE a.email=?",
      [email.toLowerCase()]
    );

    let user_id;
    if (accRows.length) {
      // Update role to admin and reset password if provided
      user_id = accRows[0].user_id;
      const hash = await bcrypt.hash(password, 10);
      await conn.execute(
        "UPDATE account SET role=?, password_hash=?, is_active=1 WHERE user_id=?",
        [role, hash, user_id]
      );
      await conn.execute(
        "UPDATE user SET first_name=COALESCE(?, first_name), last_name=COALESCE(?, last_name) WHERE user_id=?",
        [first_name, last_name, user_id]
      );
    } else {
      // Create user + account
      const [u] = await conn.execute(
        "INSERT INTO user(first_name,last_name,email,joined_at) VALUES(?,?,?,CURDATE())",
        [first_name, last_name, email.toLowerCase()]
      );
      user_id = u.insertId;
      const hash = await bcrypt.hash(password, 10);
      await conn.execute(
        "INSERT INTO account(user_id,email,password_hash,role,is_active) VALUES(?,?,?,?,1)",
        [user_id, email.toLowerCase(), hash, role]
      );
    }

    await conn.commit();
    console.log(`✅ Staff account ready: ${email} / ${password}`);
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to seed staff account:", e.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

upsertAdmin();
