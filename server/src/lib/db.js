// server/src/lib/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

// required envs
const required = ["DB_HOST", "DB_USER", "DB_NAME"];
const missing = required.filter((k) => !process.env[k] || process.env[k] === "");
if (missing.length) {
  console.error("Missing required .env variable(s):", missing.join(", "));
  process.exit(1);
}

// build SSL (off by default for local)
let ssl;
const DB_SSL = (process.env.DB_SSL || "off").toLowerCase(); // "on" | "off"
if (DB_SSL === "on") {
  // if you provide a CA path, use it; otherwise system CAs
  const caPath = process.env.DB_SSL_CA; // e.g. /etc/ssl/certs/ca-certificates.crt
  ssl = caPath && fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath) } : { rejectUnauthorized: true };
}

const isAzure = (process.env.DB_HOST || "").endsWith(".mysql.database.azure.com");
const isLocalHost = ["127.0.0.1", "localhost"].includes(process.env.DB_HOST);

// Require password for Azure or any non-local host
if (isAzure || !isLocalHost) {
  if (!process.env.DB_PASSWORD) {
    console.error("Missing DB_PASSWORD for remote/Azure connection.");
    process.exit(1);
  }
}


// keep everything above as-is (your DB_SSL / DB_SSL_CA logic)
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  // ⬇️ use the prepared ssl object
  ssl,
});

// Ensure each new connection uses the library timezone for server-side NOW() and comparisons
const LIBRARY_TZ = process.env.LIBRARY_TZ || 'America/Chicago';
try {
  // Set on the first acquired connection (may only affect that session)
  pool
    .query("SET time_zone = ?", [LIBRARY_TZ])
    .then(() => console.log("[db] Initial pool session time_zone set to", LIBRARY_TZ))
    .catch((err) => console.error("[db] Failed to set initial time_zone", err));

  // Also set on every new pooled connection
  if (typeof pool.on === 'function') {
    pool.on('connection', (conn) => {
      const wrapQuery = (sql, params = []) =>
        new Promise((resolve, reject) => {
          conn.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
        });
      wrapQuery("SET time_zone = ?", [LIBRARY_TZ])
        .then(() => wrapQuery("SELECT @@time_zone AS tz"))
        .then((rows) => {
          console.log("[db] New connection time_zone =", rows?.[0]?.tz);
        })
        .catch((err) => {
          console.error("[db] Failed to configure time_zone for connection", err);
        });
    });
  }
} catch (err) {
  console.error("[db] Unexpected error while configuring time_zone", err);
}



// Optional: call this from your server startup to verify DB connectivity
export async function pingDB() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}
