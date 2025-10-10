import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,     // e.g. mysql://appadmin:pass@localhost:3306/appdb
  waitForConnections: true,
  connectionLimit: 10
});
