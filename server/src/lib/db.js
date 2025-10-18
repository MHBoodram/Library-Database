import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

// Prefer passing the connection string directly to createPool
export const pool = mysql.createPool(process.env.DATABASE_URL);
