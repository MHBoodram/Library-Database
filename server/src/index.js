import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { pool } from "./lib/db.js";

const PORT = Number(process.env.PORT) || 3000;

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

    // GET /api/items
    if (req.method === "GET" && pathname === "/api/items") {
      const [rows] = await pool.query(
        "SELECT id, name, createdAt FROM items ORDER BY id DESC"
      );
      return sendJSON(res, 200, rows);
    }

    // POST /api/items
    if (req.method === "POST" && pathname === "/api/items") {
      let body;
      try {
        body = await readJSONBody(req);
      } catch {
        return sendJSON(res, 400, { error: "invalid_json" });
      }
      const name = (body?.name ?? "").toString().trim();
      if (!name) return sendJSON(res, 400, { error: "name_required" });

      const [r] = await pool.execute("INSERT INTO items(name) VALUES(?)", [name]);
      return sendJSON(res, 201, { id: r.insertId, name });
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
