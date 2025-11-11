import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sendJSON, requireEmployeeRole } from "../lib/http.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_DIR = join(__dirname, "..", "data");
const LOG_FILE = join(LOG_DIR, "activity.log");

// In-memory fallback buffer (when FS is read-only or unavailable)
const memoryBuffer = [];
const MEMORY_MAX = 5000;

async function ensureDir() {
  try { await fs.mkdir(LOG_DIR, { recursive: true }); } catch {}
}

async function appendLine(line) {
  try {
    await ensureDir();
    await fs.appendFile(LOG_FILE, line + "\n", "utf8");
  } catch (err) {
    // Fallback to memory buffer
    memoryBuffer.push(line);
    if (memoryBuffer.length > MEMORY_MAX) memoryBuffer.shift();
  }
}

export async function logRequestActivity(entry) {
  const safe = {
    ts: new Date().toISOString(),
    method: entry.method || "",
    path: entry.path || "",
    status: Number(entry.status ?? 0),
    ip: entry.ip || "",
    user: entry.user ? {
      sub: entry.user.sub ?? null,
      uid: entry.user.uid ?? null,
      email: entry.user.email ?? null,
      employee_id: entry.user.employee_id ?? null,
      employee_role: entry.user.employee_role ?? null,
      role: entry.user.role ?? null,
    } : null,
  };
  const line = JSON.stringify(safe);
  await appendLine(line);
}

export const listActivity = (JWT_SECRET) => async (req, res) => {
  const auth = requireEmployeeRole(req, res, JWT_SECRET, "admin");
  if (!auth) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Math.max(1, Math.min(1000, Number(url.searchParams.get("limit") || 200)));

  let lines = [];
  try {
    const data = await fs.readFile(LOG_FILE, "utf8");
    lines = data.split(/\r?\n/).filter(Boolean);
  } catch {
    // No file or unreadable, use memory buffer only
    lines = memoryBuffer.slice();
  }

  // include memory buffer tail if file exists too
  if (memoryBuffer.length && lines.length < limit) {
    const merged = lines.concat(memoryBuffer);
    lines = merged;
  }

  const recent = lines.slice(-limit).reverse();
  const rows = recent.map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
  return sendJSON(res, 200, { rows });
};
