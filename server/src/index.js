import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import crypto from "node:crypto";
import { pool } from "./lib/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

// allow both common Vite ports in dev; adjust as needed or just use FRONTEND_ORIGIN
const ALLOWED_ORIGINS = new Set([
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "http://localhost:5174",
]);

function setCors(res, origin) {
  if (!origin || ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || [...ALLOWED_ORIGINS][0]);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
}

function sendJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

async function readJSONBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("invalid_json");
  }
}

function getAuthUser(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    sendJSON(res, 401, { error: "unauthorized" });
    return null;
  }
  return user;
}

const server = http.createServer(async (req, res) => {
  try {
    const origin = req.headers.origin || "";
    setCors(res, origin);

    if (req.method === "OPTIONS") {
      res.statusCode = 204; // preflight OK
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;

    // GET /api/health
    if (req.method === "GET" && pathname === "/api/health") {
      return sendJSON(res, 200, { ok: true, node: process.version });
    }

    // ---------- AUTH ----------
    if (req.method === "POST" && pathname === "/api/auth/register") {
      const body = await readJSONBody(req);
      const first = (body.first_name || "").trim();
      const last = (body.last_name || "").trim();
      const email = (body.email || "").trim().toLowerCase();
      const password = body.password || "";
      // Force all public registrations to be "student" role
      // Staff/faculty must be created by admin
      const role = "student";
      if (!first || !last || !email || !password)
        return sendJSON(res, 400, { error: "missing_fields" });

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [u] = await conn.execute(
          "INSERT INTO user(first_name,last_name,email,joined_at) VALUES(?,?,?,CURDATE())",
          [first, last, email]
        );
        const user_id = u.insertId;
        const hash = await bcrypt.hash(password, 10);
        await conn.execute(
          "INSERT INTO account(user_id,email,password_hash,role) VALUES(?,?,?,?)",
          [user_id, email, hash, role]
        );
        await conn.commit();
        return sendJSON(res, 201, { user_id, email, role });
      } catch (e) {
        try { await conn.rollback(); } catch {}
        return sendJSON(res, 400, { error: "register_failed", details: e.message });
      } finally {
        conn.release();
      }
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
      const { email = "", password = "" } = await readJSONBody(req);
      const [rows] = await pool.execute(
        "SELECT a.account_id, a.user_id, a.email, a.password_hash, a.role, a.is_active, u.first_name, u.last_name FROM account a JOIN user u ON u.user_id=a.user_id WHERE a.email=?",
        [email.toLowerCase()]
      );
      const acc = rows[0];
      if (!acc || !acc.is_active) return sendJSON(res, 401, { error: "invalid_login" });
      const ok = await bcrypt.compare(password, acc.password_hash);
      if (!ok) return sendJSON(res, 401, { error: "invalid_login" });
      const token = jwt.sign({ user_id: acc.user_id, role: acc.role, email: acc.email }, JWT_SECRET, { expiresIn: "8h" });
      return sendJSON(res, 200, { token, user: { user_id: acc.user_id, name: acc.first_name + " " + acc.last_name, role: acc.role, email: acc.email } });
    }

    if (req.method === "GET" && pathname === "/api/auth/me") {
      const auth = requireAuth(req, res);
      if (!auth) return; // already responded
      return sendJSON(res, 200, { user: auth });
    }

    // ---------- DATA ENTRY: users/items/copies CRUD (minimal) ----------
    if (req.method === "POST" && pathname === "/api/items") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const b = await readJSONBody(req);
      const title = (b.title || "").trim();
      if (!title) return sendJSON(res, 400, { error: "title_required" });
      const [r] = await pool.execute("INSERT INTO item(title, subject, classification) VALUES(?,?,?)", [title, b.subject || null, b.classification || null]);
      return sendJSON(res, 201, { item_id: r.insertId });
    }

    if (req.method === "PUT" && pathname.startsWith("/api/items/")) {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const item_id = Number(pathname.split("/").pop());
      const b = await readJSONBody(req);
      await pool.execute(
        "UPDATE item SET title=COALESCE(?,title), subject=COALESCE(?,subject), classification=COALESCE(?,classification) WHERE item_id=?",
        [b.title || null, b.subject || null, b.classification || null, item_id]
      );
      return sendJSON(res, 200, { ok: true });
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/items/")) {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const item_id = Number(pathname.split("/").pop());
      await pool.execute("DELETE FROM item WHERE item_id=?", [item_id]);
      return sendJSON(res, 200, { ok: true });
    }

    if (req.method === "POST" && pathname === "/api/copies") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const b = await readJSONBody(req);
      const item_id = Number(b.item_id);
      const barcode = (b.barcode || "").trim();
      if (!item_id || !barcode) return sendJSON(res, 400, { error: "invalid_payload" });
      const [r] = await pool.execute("INSERT INTO copy(item_id, barcode, status, shelf_location, acquired_at) VALUES(?,?,?,?,CURDATE())", [item_id, barcode, b.status || 'available', b.shelf_location || null]);
      return sendJSON(res, 201, { copy_id: r.insertId });
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/copies/")) {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const copy_id = Number(pathname.split("/").pop());
      await pool.execute("UPDATE copy SET status='lost' WHERE copy_id=?", [copy_id]);
      return sendJSON(res, 200, { ok: true });
    }

    if (req.method === "PUT" && pathname.startsWith("/api/copies/")) {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const copy_id = Number(pathname.split("/").pop());
      const b = await readJSONBody(req);
      await pool.execute(
        "UPDATE copy SET status=COALESCE(?,status), shelf_location=COALESCE(?,shelf_location) WHERE copy_id=?",
        [b.status || null, b.shelf_location || null, copy_id]
      );
      return sendJSON(res, 200, { ok: true });
    }

    // ---------- LOANS ----------
    if (req.method === "POST" && pathname === "/api/loans/checkout") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const b = await readJSONBody(req);
      const user_id = Number(b.user_id || auth.user_id);
      const copy_id = Number(b.copy_id);
      const employee_id = Number(b.employee_id) || null;
      if (!user_id || !copy_id) return sendJSON(res, 400, { error: "invalid_payload" });
      try {
        await pool.query("CALL sp_checkout(?,?,?)", [user_id, copy_id, employee_id]);
        return sendJSON(res, 201, { ok: true });
      } catch (e) {
        return sendJSON(res, 400, { error: e.message });
      }
    }

    if (req.method === "POST" && pathname === "/api/loans/return") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const b = await readJSONBody(req);
      const loan_id = Number(b.loan_id);
      const employee_id = Number(b.employee_id) || null;
      if (!loan_id) return sendJSON(res, 400, { error: "invalid_payload" });
      await pool.query("CALL sp_return(?,?)", [loan_id, employee_id]);
      return sendJSON(res, 200, { ok: true });
    }

    // ---------- HOLDS (basic) ----------
    if (req.method === "POST" && pathname === "/api/holds/place") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const b = await readJSONBody(req);
      const user_id = Number(b.user_id || auth.user_id);
      const item_id = Number(b.item_id) || null;
      const copy_id = Number(b.copy_id) || null;
      if (!user_id || (!item_id && !copy_id) || (item_id && copy_id)) return sendJSON(res, 400, { error: "invalid_payload" });
      const [r] = await pool.execute(
        "INSERT INTO hold(user_id,item_id,copy_id,hold_date,status) VALUES(?,?,?,?, 'active')",
        [user_id, item_id, copy_id, new Date()]
      );
      return sendJSON(res, 201, { hold_id: r.insertId });
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/holds/")) {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const hold_id = Number(pathname.split("/").pop());
      await pool.execute("UPDATE hold SET status='cancelled' WHERE hold_id=?", [hold_id]);
      return sendJSON(res, 200, { ok: true });
    }

    // ---------- REPORTS (views) - Staff/Admin only ----------
    if (req.method === "GET" && pathname === "/api/reports/overdue") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      // Only staff can view reports
      if (auth.role !== 'staff') {
        return sendJSON(res, 403, { error: "forbidden", message: "Access denied. Staff only." });
      }
      const [rows] = await pool.query("SELECT * FROM v_overdue_loans");
      return sendJSON(res, 200, rows);
    }
    if (req.method === "GET" && pathname === "/api/reports/balances") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      // Only staff can view reports
      if (auth.role !== 'staff') {
        return sendJSON(res, 403, { error: "forbidden", message: "Access denied. Staff only." });
      }
      const [rows] = await pool.query("SELECT * FROM v_user_balances");
      return sendJSON(res, 200, rows);
    }
    if (req.method === "GET" && pathname === "/api/reports/top-items") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      // Only staff can view reports
      if (auth.role !== 'staff') {
        return sendJSON(res, 403, { error: "forbidden", message: "Access denied. Staff only." });
      }
      const [rows] = await pool.query("SELECT * FROM v_top_items_30d");
      return sendJSON(res, 200, rows);
    }

    // 404
    sendJSON(res, 404, { error: "not_found" });
  } catch (err) {
    console.error("Server error:", err);
    sendJSON(res, 500, { error: "server_error" });
  }
});

server.listen(PORT, () => {
  console.log(`API running (no-Express) on http://localhost:${PORT}`);
});
