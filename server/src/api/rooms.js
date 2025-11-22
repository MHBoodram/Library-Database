import { sendJSON, readJSONBody, requireRole, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const createRoom = (JWT_SECRET) => async (req, res) => {
  // allow staff or admin users to create rooms
  const user = requireAuth(req, res, JWT_SECRET);
  if (!user) return;
  if (user.role !== 'staff' && user.role !== 'admin') {
    return sendJSON(res, 403, { error: 'forbidden' });
  }

  const body = await readJSONBody(req);
  const room_number = (body.room_number || "").trim();
  const capacity = body.capacity != null && body.capacity !== "" ? Number(body.capacity) : null;
  const features = (body.features || "").trim() || null;

  if (!room_number) {
    return sendJSON(res, 400, { error: "invalid_payload", message: "room_number is required." });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO room (room_number, capacity, features) VALUES (?, ?, ?)",
      [room_number, capacity, features]
    );
    return sendJSON(res, 201, { ok: true, room_id: result.insertId });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return sendJSON(res, 409, { error: "room_exists", message: "Room number already exists." });
    }
    console.error("Create room failed:", err);
    return sendJSON(res, 500, { error: "room_create_failed", details: err.message });
  }
};

// Public list of rooms for selection (auth can be added later if needed)
export const listRooms = () => async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT room_id, room_number, capacity, features FROM room ORDER BY room_number ASC LIMIT 500"
    );
    return sendJSON(res, 200, rows);
  } catch (err) {
    console.error("List rooms failed:", err);
    return sendJSON(res, 500, { error: "rooms_fetch_failed" });
  }
};

// Update a room (partial update)
export const updateRoom = (JWT_SECRET) => async (req, res, params) => {
  const user = requireAuth(req, res, JWT_SECRET);
  if (!user) return;
  if (user.role !== 'staff' && user.role !== 'admin') {
    return sendJSON(res, 403, { error: 'forbidden' });
  }

  const roomId = Number(params?.id);
  if (!Number.isInteger(roomId) || roomId <= 0) {
    return sendJSON(res, 400, { error: "invalid_room_id" });
  }

  const body = await readJSONBody(req);
  const fields = [];
  const values = [];

  if (body.room_number != null) {
    const v = String(body.room_number).trim();
    if (!v) return sendJSON(res, 400, { error: "invalid_payload", message: "room_number cannot be empty" });
    fields.push("room_number = ?");
    values.push(v);
  }
  if (body.capacity !== undefined) {
    const cap = body.capacity === null || body.capacity === "" ? null : Number(body.capacity);
    if (cap !== null && (!Number.isFinite(cap) || cap < 0)) {
      return sendJSON(res, 400, { error: "invalid_payload", message: "capacity must be >= 0" });
    }
    fields.push("capacity = ?");
    values.push(cap);
  }
  if (body.features !== undefined) {
    const feat = body.features != null && body.features !== "" ? String(body.features).trim() : null;
    fields.push("features = ?");
    values.push(feat);
  }

  if (fields.length === 0) {
    return sendJSON(res, 400, { error: "nothing_to_update" });
  }

  const sql = `UPDATE room SET ${fields.join(", ")} WHERE room_id = ?`;
  values.push(roomId);
  try {
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return sendJSON(res, 404, { error: "room_not_found" });
    return sendJSON(res, 200, { ok: true });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return sendJSON(res, 409, { error: "room_exists", message: "Room number already exists." });
    }
    console.error("Update room failed:", err);
    return sendJSON(res, 500, { error: "room_update_failed", details: err.message });
  }
};

// Delete a room
export const deleteRoom = (JWT_SECRET) => async (req, res, params) => {
  const user = requireAuth(req, res, JWT_SECRET);
  if (!user) return;
  if (user.role !== 'staff' && user.role !== 'admin') {
    return sendJSON(res, 403, { error: 'forbidden' });
  }

  const roomId = Number(params?.id);
  if (!Number.isInteger(roomId) || roomId <= 0) {
    return sendJSON(res, 400, { error: "invalid_room_id" });
  }

  try {
    const [result] = await pool.execute("DELETE FROM room WHERE room_id = ?", [roomId]);
    if (result.affectedRows === 0) return sendJSON(res, 404, { error: "room_not_found" });
    return sendJSON(res, 200, { ok: true });
  } catch (err) {
    if (err?.code === "ER_ROW_IS_REFERENCED_2") {
      return sendJSON(res, 409, { error: "room_in_use", message: "Room has reservations and cannot be deleted." });
    }
    console.error("Delete room failed:", err);
    return sendJSON(res, 500, { error: "room_delete_failed", details: err.message });
  }
};
