import { sendJSON, readJSONBody, requireRole, requireAuth } from "../lib/http.js";
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

  // Validate library operation hours
  const hoursErrors = validateLibraryHours(start, end);
  if (hoursErrors.length > 0) {
    return sendJSON(res, 400, { error: "outside_library_hours", message: hoursErrors.join(" ") });
  }

  try {
    // Server-side overlap prevention in case DB trigger isn't installed
    const [conflicts] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM reservation r
       WHERE r.room_id = ?
         AND r.status = 'active'
         AND NOT (r.end_time <= ? OR r.start_time >= ?)`,
      [room_id, toMySQLDateTime(start), toMySQLDateTime(end)]
    );
    if (Number(conflicts[0]?.cnt || 0) > 0) {
      return sendJSON(res, 409, { error: "reservation_conflict", message: "Room already booked for that timeslot." });
    }

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
            r.start_time, r.end_time, r.status, r.employee_id,
            CASE 
              WHEN r.end_time < NOW() AND r.status = 'active' THEN 'completed'
              ELSE r.status
            END as computed_status
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

/**
 * Library operation hours validation
 * Monday - Friday: 7:00 AM - 10:00 PM
 * Saturday: 9:00 AM - 8:00 PM
 * Sunday: 10:00 AM - 6:00 PM
 */
function validateLibraryHours(startDate, endDate) {
  const errors = [];
  
  // Check start time
  const startDay = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const startTime = startHour + startMinutes / 60;
  
  // Check end time
  const endDay = endDate.getDay();
  const endHour = endDate.getHours();
  const endMinutes = endDate.getMinutes();
  const endTime = endHour + endMinutes / 60;
  
  // Monday - Friday: 7:00 AM - 10:00 PM
  if (startDay >= 1 && startDay <= 5) {
    if (startTime < 7 || startTime >= 22) {
      errors.push("Monday-Friday library hours are 7:00 AM - 10:00 PM. Start time is outside these hours.");
    }
  }
  if (endDay >= 1 && endDay <= 5) {
    if (endTime > 22) {
      errors.push("Monday-Friday library hours are 7:00 AM - 10:00 PM. End time is outside these hours.");
    }
  }
  
  // Saturday: 9:00 AM - 8:00 PM
  if (startDay === 6) {
    if (startTime < 9 || startTime >= 20) {
      errors.push("Saturday library hours are 9:00 AM - 8:00 PM. Start time is outside these hours.");
    }
  }
  if (endDay === 6) {
    if (endTime > 20) {
      errors.push("Saturday library hours are 9:00 AM - 8:00 PM. End time is outside these hours.");
    }
  }
  
  // Sunday: 10:00 AM - 6:00 PM
  if (startDay === 0) {
    if (startTime < 10 || startTime >= 18) {
      errors.push("Sunday library hours are 10:00 AM - 6:00 PM. Start time is outside these hours.");
    }
  }
  if (endDay === 0) {
    if (endTime > 18) {
      errors.push("Sunday library hours are 10:00 AM - 6:00 PM. End time is outside these hours.");
    }
  }
  
  // Check if reservation spans across multiple days
  if (startDay !== endDay) {
    errors.push("Reservations cannot span multiple days. Please book within the same day's operating hours.");
  }
  
  return errors;
}

// Student self-service: create a reservation for the authenticated user
export const createReservationSelf = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const body = await readJSONBody(req);
  const user_id = Number(auth.uid || auth.user_id);
  const room_id = Number(body.room_id);
  const start = normalizeDateInput(body.start_time);
  const end = normalizeDateInput(body.end_time);
  if (!user_id || !room_id || !start || !end) {
    return sendJSON(res, 400, { error: "invalid_payload", message: "room_id, start_time, end_time are required." });
  }
  if (end <= start) {
    return sendJSON(res, 400, { error: "invalid_timespan", message: "end_time must be after start_time." });
  }

  // Validate library operation hours
  const hoursErrors = validateLibraryHours(start, end);
  if (hoursErrors.length > 0) {
    return sendJSON(res, 400, { error: "outside_library_hours", message: hoursErrors.join(" ") });
  }

  try {
    const [conflicts] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM reservation r
       WHERE r.room_id = ? AND r.status = 'active'
         AND NOT (r.end_time <= ? OR r.start_time >= ?)`,
      [room_id, toMySQLDateTime(start), toMySQLDateTime(end)]
    );
    if (Number(conflicts[0]?.cnt || 0) > 0) {
      return sendJSON(res, 409, { error: "reservation_conflict", message: "Room already booked for that timeslot." });
    }
    const [result] = await pool.execute(
      `INSERT INTO reservation (user_id, room_id, start_time, end_time, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [user_id, room_id, toMySQLDateTime(start), toMySQLDateTime(end)]
    );
    return sendJSON(res, 201, { reservation_id: result.insertId, ok: true });
  } catch (err) {
    console.error("Create self reservation failed:", err);
    return sendJSON(res, 500, { error: "reservation_failed", details: err.message });
  }
};

// Student: list my reservations
export const listMyReservations = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const userId = Number(auth.uid || auth.user_id);
  try {
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.room_id, rm.room_number, r.start_time, r.end_time, r.status,
              CASE 
                WHEN r.end_time < NOW() AND r.status = 'active' THEN 'completed'
                ELSE r.status
              END as computed_status
       FROM reservation r
       JOIN room rm ON rm.room_id = r.room_id
       WHERE r.user_id = ?
       ORDER BY r.start_time DESC
       LIMIT 200`,
      [userId]
    );
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("List my reservations failed:", err);
    return sendJSON(res, 500, { error: "reservations_fetch_failed", details: err.message });
  }
};

// Cancel reservation (staff or patron who owns it)
export const cancelReservation = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  
  console.log("Cancel reservation - params:", params);
  
  const reservationId = Number(params?.id);
  if (!reservationId || isNaN(reservationId)) {
    console.log("Invalid reservation ID:", params?.id, "->", reservationId);
    return sendJSON(res, 400, { error: "invalid_id", message: "Invalid reservation ID" });
  }

  try {
    // Check if reservation exists and get details
    const [reservations] = await pool.execute(
      "SELECT reservation_id, user_id, status FROM reservation WHERE reservation_id = ?",
      [reservationId]
    );

    console.log("Found reservations:", reservations.length, reservations);

    if (reservations.length === 0) {
      return sendJSON(res, 404, { error: "not_found", message: "Reservation not found" });
    }

    const reservation = reservations[0];

    // Allow if staff or if user owns the reservation
    const isStaff = auth.role === 'staff';
    const isOwner = Number(auth.uid || auth.user_id) === Number(reservation.user_id);

    if (!isStaff && !isOwner) {
      return sendJSON(res, 403, { error: "forbidden", message: "You can only cancel your own reservations" });
    }

    if (reservation.status === 'cancelled') {
      return sendJSON(res, 400, { error: "already_cancelled", message: "Reservation is already cancelled" });
    }

    // Update status to cancelled
    await pool.execute(
      "UPDATE reservation SET status = 'cancelled' WHERE reservation_id = ?",
      [reservationId]
    );

    return sendJSON(res, 200, { ok: true, message: "Reservation cancelled successfully" });
  } catch (err) {
    console.error("Cancel reservation error:", err);
    return sendJSON(res, 500, { error: "server_error", message: err.message || "Failed to cancel reservation" });
  }
};

// Delete reservation (staff only - permanent removal)
export const deleteReservation = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff");
  if (!auth) return;
  
  console.log("Delete reservation - params:", params);
  
  const reservationId = Number(params?.id);
  if (!reservationId || isNaN(reservationId)) {
    console.log("Invalid reservation ID:", params?.id, "->", reservationId);
    return sendJSON(res, 400, { error: "invalid_id", message: "Invalid reservation ID" });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM reservation WHERE reservation_id = ?",
      [reservationId]
    );

    console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, { error: "not_found", message: "Reservation not found" });
    }

    return sendJSON(res, 200, { ok: true, message: "Reservation deleted successfully" });
  } catch (err) {
    console.error("Delete reservation error:", err);
    return sendJSON(res, 500, { error: "server_error", message: err.message || "Failed to delete reservation" });
  }
};
