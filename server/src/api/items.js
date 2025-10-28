import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const createItem = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const title = (b.title||"").trim();
  if (!title) return sendJSON(res, 400, { error:"title_required" });
  const subject = (b.subject || "").trim() || null;
  const classification = (b.classification || "").trim() || null;

  const itemType = typeof b.item_type === "string" ? b.item_type.trim().toLowerCase() : "";
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [itemResult] = await conn.execute(
      "INSERT INTO item(title, subject, classification) VALUES(?,?,?)",
      [title, subject, classification]
    );
    const item_id = itemResult.insertId;

    if (["book", "device", "media"].includes(itemType)) {
      if (itemType === "book") {
        const isbn = (b.isbn || "").trim() || null;
        const publisher = (b.publisher || "").trim() || null;
        const yearVal = parseInt(b.publication_year, 10);
        const publication_year = Number.isFinite(yearVal) && yearVal > 0 ? yearVal : null;
        await conn.execute(
          "INSERT INTO book(item_id,isbn,publisher,publication_year) VALUES(?,?,?,?)",
          [item_id, isbn, publisher, publication_year]
        );
      } else if (itemType === "device") {
        const model = (b.model || "").trim() || null;
        const manufacturer = (b.manufacturer || "").trim() || null;
        await conn.execute(
          "INSERT INTO device(item_id,model,manufacturer) VALUES(?,?,?)",
          [item_id, model, manufacturer]
        );
      } else if (itemType === "media") {
        const publisher = (b.publisher || "").trim() || null;
        const yearVal = parseInt(b.publication_year, 10);
        const publication_year = Number.isFinite(yearVal) && yearVal > 0 ? yearVal : null;
        const lengthVal = parseInt(b.length_minutes, 10);
        const length_minutes = Number.isFinite(lengthVal) && lengthVal > 0 ? lengthVal : null;
        const normalizedType = typeof b.media_type === "string" ? b.media_type.trim().toLowerCase() : "";
        const mediaTypeMap = {
          "dvd": "DVD",
          "blu-ray": "Blu-ray",
          "cd": "CD",
          "other": "Other",
        };
        const media_type = mediaTypeMap[normalizedType] || "DVD";
        await conn.execute(
          "INSERT INTO media(item_id,media_type,length_minutes,publisher,publication_year) VALUES(?,?,?,?,?)",
          [item_id, media_type, length_minutes, publisher, publication_year]
        );
      }
    }

    await conn.commit();
    return sendJSON(res, 201, { item_id });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    return sendJSON(res, 400, { error: "item_create_failed", details: err.message });
  } finally {
    conn.release();
  }
};

export const updateItem = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  await pool.execute(
    "UPDATE item SET title=COALESCE(?,title), subject=COALESCE(?,subject), classification=COALESCE(?,classification) WHERE item_id=?",
    [b.title||null, b.subject||null, b.classification||null, Number(params.id)]
  );
  return sendJSON(res, 200, { ok:true });
};

export const deleteItem = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  await pool.execute("DELETE FROM item WHERE item_id=?", [Number(params.id)]);
  return sendJSON(res, 200, { ok:true });
};
