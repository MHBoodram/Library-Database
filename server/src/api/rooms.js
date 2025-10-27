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
