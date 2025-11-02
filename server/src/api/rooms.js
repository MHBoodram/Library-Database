import { sendJSON, readJSONBody, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const createRoom = (JWT_SECRET) => async (req, res) => {
  const auth = requireRole(req, res, JWT_SECRET, "staff");
  if (!auth) return;

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
