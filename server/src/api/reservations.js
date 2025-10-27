import { sendJSON, readJSONBody, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

function normalizeDateInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const createReservation = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff");
  if (!auth) return;

  const body = await readJSONBody(req);
  const user_id = Number(body.user_id);
  const room_id = Number(body.room_id);
  const employee_id = Number(body.employee_id || auth?.employee_id || 0) || null;
  const start = normalizeDateInput(body.start_time);
  const end = normalizeDateInput(body.end_time);

  if (!user_id || !room_id || !start || !end) {
    return sendJSON(res, 400, { error: "invalid_payload", message: "user_id, room_id, start_time, end_time are required." });
  }
  if (end <= start) {
    return sendJSON(res, 400, { error: "invalid_timespan", message: "end_time must be after start_time." });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO reservation (user_id, room_id, employee_id, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [user_id, room_id, employee_id, toMySQLDateTime(start), toMySQLDateTime(end)]
    );
    return sendJSON(res, 201, { reservation_id: result.insertId, ok: true });
  } catch (err) {
    if (err?.sqlState === "45000") {
      return sendJSON(res, 409, { error: "reservation_conflict", message: err.sqlMessage || "Room already booked for that timeslot." });
    }
    if (err?.code === "ER_NO_REFERENCED_ROW_2") {
      return sendJSON(res, 404, { error: "foreign_key_violation", message: err.sqlMessage });
    }
    console.error("Create reservation failed:", err);
    return sendJSON(res, 500, { error: "reservation_failed", details: err.message });
  }
};

export const listReservations = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff");
  if (!auth) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get("room_id");
  const sql = [
    `SELECT r.reservation_id, r.user_id, u.first_name, u.last_name, r.room_id, rm.room_number,
            r.start_time, r.end_time, r.status, r.employee_id
       FROM reservation r
       JOIN room rm ON rm.room_id = r.room_id
       JOIN user u ON u.user_id = r.user_id`
  ];
  const params = [];
  if (roomId) {
    sql.push("WHERE r.room_id = ?");
    params.push(Number(roomId));
  }
  sql.push("ORDER BY r.start_time ASC");

  try {
    const [rows] = await pool.query(sql.join(" "), params);
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("List reservations failed:", err);
    return sendJSON(res, 500, { error: "reservations_fetch_failed", details: err.message });
  }
};

function toMySQLDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
