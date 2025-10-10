import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./lib/db.js";

const app = express();

// allow frontend in dev (adjust later for Azure)
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());

// health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, node: process.version });
});

// list items
app.get("/api/items", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, createdAt FROM items ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/items error:", err);
    res.status(500).json({ error: "db_error" });
  }
});

// add item
app.post("/api/items", async (req, res) => {
  try {
    const name = (req.body?.name ?? "").toString().trim();
    if (!name) return res.status(400).json({ error: "name_required" });

    const [r] = await pool.execute("INSERT INTO items(name) VALUES(?)", [name]);
    res.status(201).json({ id: r.insertId, name });
  } catch (err) {
    console.error("POST /api/items error:", err);
    res.status(500).json({ error: "db_error" });
  }
});

// shutdown
process.on("SIGINT", async () => {
  try { await pool.end(); } catch {}
  process.exit(0);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
