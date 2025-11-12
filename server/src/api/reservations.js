import { sendJSON, readJSONBody, requireRole, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

const RAW_LIBRARY_TZ = (process.env.LIBRARY_TZ || "America/Chicago").trim();
const LIBRARY_TZ = RAW_LIBRARY_TZ || "America/Chicago";
const WEEKDAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
let activeTimeZone = LIBRARY_TZ;
let libraryFormatter;

function buildFormatter(timeZone) {
  const baseOptions = {
    timeZone,
    weekday: "short",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  try {
    const fmt = new Intl.DateTimeFormat("en-US", baseOptions);
    activeTimeZone = fmt.resolvedOptions().timeZone || timeZone;
    return fmt;
  } catch (err) {
    console.warn(
      `[reservations] Failed to initialize timezone formatter for "${timeZone}". Falling back to UTC.`,
      err
    );
    activeTimeZone = "UTC";
    return new Intl.DateTimeFormat("en-US", { ...baseOptions, timeZone: "UTC" });
  }
}

function getLibraryFormatter() {
  if (!libraryFormatter) {
    libraryFormatter = buildFormatter(LIBRARY_TZ);
  }
  return libraryFormatter;
}

function getLibraryTimeParts(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const parts = getLibraryFormatter().formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekdayRaw = (map.weekday || "").slice(0, 3).toLowerCase();
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second || "00",
    weekdayIndex: WEEKDAY_INDEX[weekdayRaw] ?? 0,
    ymd: `${map.year}-${map.month}-${map.day}`,
  };
}

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

  // Validate 2-hour maximum duration
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  if (durationHours > 2) {
    return sendJSON(res, 400, { error: "duration_exceeded", message: "Reservations cannot exceed 2 hours." });
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
    return sendJSON(res, 500, { error: "reservation_failed", message: err.message });
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

// Format a JS Date for MySQL DATETIME storage in local library time
// The database stores times as they should appear in the library's timezone
function toMySQLDateTime(date) {
  const parts = getLibraryTimeParts(date);
  if (!parts) return null;
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * Library operation hours validation
 * Monday - Friday: 7:00 AM - 10:00 PM
 * Saturday: 9:00 AM - 8:00 PM
 * Sunday: 10:00 AM - 6:00 PM
 */
function validateLibraryHours(startDate, endDate) {
  const errors = [];

  const s = getLibraryTimeParts(startDate);
  const e = getLibraryTimeParts(endDate);
  if (!s || !e) {
    errors.push("Invalid date provided.");
    return errors;
  }
  const startTime = Number(s.hour) + Number(s.minute) / 60;
  const endTime = Number(e.hour) + Number(e.minute) / 60;

  // Monday - Friday: 7:00 AM - 10:00 PM
  if (s.weekdayIndex >= 1 && s.weekdayIndex <= 5) {
    if (startTime < 7 || startTime >= 22) {
      errors.push("Monday-Friday library hours are 7:00 AM - 10:00 PM. Start time is outside these hours.");
    }
  }
  if (e.weekdayIndex >= 1 && e.weekdayIndex <= 5) {
    if (endTime > 22) {
      errors.push("Monday-Friday library hours are 7:00 AM - 10:00 PM. End time is outside these hours.");
    }
  }

  // Saturday: 9:00 AM - 8:00 PM
  if (s.weekdayIndex === 6) {
    if (startTime < 9 || startTime >= 20) {
      errors.push("Saturday library hours are 9:00 AM - 8:00 PM. Start time is outside these hours.");
    }
  }
  if (e.weekdayIndex === 6) {
    if (endTime > 20) {
      errors.push("Saturday library hours are 9:00 AM - 8:00 PM. End time is outside these hours.");
    }
  }

  // Sunday: 10:00 AM - 6:00 PM
  if (s.weekdayIndex === 0) {
    if (startTime < 10 || startTime >= 18) {
      errors.push("Sunday library hours are 10:00 AM - 6:00 PM. Start time is outside these hours.");
    }
  }
  if (e.weekdayIndex === 0) {
    if (endTime > 18) {
      errors.push("Sunday library hours are 10:00 AM - 6:00 PM. End time is outside these hours.");
    }
  }

  // Enforce same-day in library timezone
  if (s.ymd !== e.ymd) {
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

  // Validate 2-hour maximum duration
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  if (durationHours > 2) {
    return sendJSON(res, 400, { error: "duration_exceeded", message: "Reservations cannot exceed 2 hours." });
  }

  // Validate library operation hours
  const hoursErrors = validateLibraryHours(start, end);
  if (hoursErrors.length > 0) {
    return sendJSON(res, 400, { error: "outside_library_hours", message: hoursErrors.join(" ") });
  }

  try {
    const startMySQL = toMySQLDateTime(start);
    const endMySQL = toMySQLDateTime(end);
    
    console.log("Checking conflicts for:", {
      room_id,
      user_id,
      startMySQL,
      endMySQL,
      startUTC: start.toISOString(),
      endUTC: end.toISOString()
    });
    
    const [conflicts] = await pool.query(
      `SELECT r.reservation_id, r.start_time, r.end_time, r.status, r.user_id
       FROM reservation r
       WHERE r.room_id = ? AND r.status = 'active'
         AND NOT (r.end_time <= ? OR r.start_time >= ?)`,
      [room_id, startMySQL, endMySQL]
    );
    
    console.log("SQL Conflict check found:", conflicts);
    console.log("Conflict count:", conflicts.length);
    
    // Also check what existing reservations exist for debugging
    const [existing] = await pool.query(
      `SELECT reservation_id, start_time, end_time, status 
       FROM reservation 
       WHERE room_id = ? AND status = 'active'
       ORDER BY start_time`,
      [room_id]
    );
    
    console.log("Existing reservations for room", room_id, ":", existing);
    
    if (conflicts.length > 0) {
      console.log("CONFLICT DETECTED - rejecting reservation");
      return sendJSON(res, 409, { error: "reservation_conflict", message: "Room already booked for that timeslot." });
    }
    
    console.log("No conflicts found, attempting to insert...");
    const [result] = await pool.execute(
      `INSERT INTO reservation (user_id, room_id, start_time, end_time, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [user_id, room_id, toMySQLDateTime(start), toMySQLDateTime(end)]
    );
    return sendJSON(res, 201, { reservation_id: result.insertId, ok: true });
  } catch (err) {
    console.error("Create self reservation failed:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      user_id,
      room_id,
      start: toMySQLDateTime(start),
      end: toMySQLDateTime(end)
    });
    return sendJSON(res, 500, { error: "reservation_failed", message: err.message });
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

// Get room availability for a specific date
export const getRoomAvailability = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff");
  if (!auth) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const dateParam = url.searchParams.get("date"); // YYYY-MM-DD format
  
  if (!dateParam) {
    return sendJSON(res, 400, { error: "invalid_payload", message: "date parameter is required (YYYY-MM-DD)" });
  }

  try {
    // Get all rooms with their features
    const [rooms] = await pool.query(
      `SELECT room_id, room_number, capacity, features 
       FROM room 
       ORDER BY room_number`
    );

    // Get all active reservations for the specified date
    const [reservations] = await pool.query(
      `SELECT reservation_id, room_id, start_time, end_time, user_id
       FROM reservation
       WHERE DATE(start_time) = ? 
         AND status = 'active'
       ORDER BY start_time`,
      [dateParam]
    );

    // Group reservations by room_id
    const reservationsByRoom = {};
    for (const res of reservations) {
      if (!reservationsByRoom[res.room_id]) {
        reservationsByRoom[res.room_id] = [];
      }
      reservationsByRoom[res.room_id].push({
        reservation_id: res.reservation_id,
        start_time: res.start_time,
        end_time: res.end_time,
        user_id: res.user_id,
      });
    }

    // Build response with rooms and their reservations
    const availability = rooms.map(room => ({
      room_id: room.room_id,
      room_number: room.room_number,
      capacity: room.capacity,
      features: room.features,
      reservations: reservationsByRoom[room.room_id] || [],
    }));

    return sendJSON(res, 200, { date: dateParam, rooms: availability });
  } catch (err) {
    console.error("Get room availability failed:", err);
    return sendJSON(res, 500, { error: "availability_fetch_failed", details: err.message });
  }
};

// Get room availability for patrons (authenticated users)
export const getRoomAvailabilityPatron = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const dateParam = url.searchParams.get("date"); // YYYY-MM-DD format
  
  if (!dateParam) {
    return sendJSON(res, 400, { error: "invalid_payload", message: "date parameter is required (YYYY-MM-DD)" });
  }

  try {
    // Get all rooms with their features
    const [rooms] = await pool.query(
      `SELECT room_id, room_number, capacity, features 
       FROM room 
       ORDER BY room_number`
    );

    // Get all active reservations for the specified date
    const [reservations] = await pool.query(
      `SELECT reservation_id, room_id, start_time, end_time, user_id
       FROM reservation
       WHERE DATE(start_time) = ? 
         AND status = 'active'
       ORDER BY start_time`,
      [dateParam]
    );

    const userId = Number(auth.uid || auth.user_id);

    // Group reservations by room_id
    const reservationsByRoom = {};
    for (const res of reservations) {
      if (!reservationsByRoom[res.room_id]) {
        reservationsByRoom[res.room_id] = [];
      }
      reservationsByRoom[res.room_id].push({
        reservation_id: res.reservation_id,
        start_time: res.start_time,
        end_time: res.end_time,
        is_mine: res.user_id === userId,
      });
    }

    // Build response with rooms and their reservations
    const availability = rooms.map(room => ({
      room_id: room.room_id,
      room_number: room.room_number,
      capacity: room.capacity,
      features: room.features,
      reservations: reservationsByRoom[room.room_id] || [],
    }));

    return sendJSON(res, 200, { date: dateParam, rooms: availability });
  } catch (err) {
    console.error("Get room availability failed:", err);
    return sendJSON(res, 500, { error: "availability_fetch_failed", details: err.message });
  }
};
