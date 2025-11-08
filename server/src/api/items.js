import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const listItems = () => async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = (url.searchParams.get("q") || "").trim();
    const idParam = (url.searchParams.get("id") || "").trim();
    const title = (url.searchParams.get("title") || "").trim();
    const author = (url.searchParams.get("author") || "").trim();

    const where = [];
    const params = [];

    // If explicit id provided, use it
    if (idParam) {
      const idNum = Number(idParam);
      if (Number.isFinite(idNum)) {
        where.push("i.item_id = ?");
        params.push(idNum);
      } else {
        return sendJSON(res, 400, { error: "invalid_id" });
      }
    }

    if (title) {
      where.push("i.title LIKE ?");
      params.push(`%${title}%`);
    }

    if (author) {
      // Match any author full_name
      where.push("a.full_name LIKE ?");
      params.push(`%${author}%`);
    }

    // Generic q: If numeric, search by ID OR title/author; else title/author
    if (q) {
      const qNum = Number(q);
      if (Number.isFinite(qNum)) {
        // Important: Numeric titles like "1984" should still match by title
        where.push("(i.item_id = ? OR i.title LIKE ? OR COALESCE(a.full_name, '') LIKE ?)");
        params.push(qNum, `%${q}%`, `%${q}%`);
      } else {
        where.push("(i.title LIKE ? OR COALESCE(a.full_name, '') LIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT 
        i.item_id,
        i.title,
        i.subject,
        i.classification,
        CASE 
          WHEN b.item_id IS NOT NULL THEN 'book'
          WHEN d.item_id IS NOT NULL THEN 'device'
          WHEN m.item_id IS NOT NULL THEN 'media'
          ELSE 'general'
        END AS item_type,
        b.isbn,
        b.publisher AS book_publisher,
        b.publication_year AS book_year,
        d.model,
        d.manufacturer,
        m.media_type,
        m.length_minutes,
        m.publisher AS media_publisher,
        m.publication_year AS media_year,
        GROUP_CONCAT(DISTINCT a.full_name ORDER BY a.full_name SEPARATOR ', ') AS authors
      FROM item i
      LEFT JOIN book b ON b.item_id = i.item_id
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      LEFT JOIN item_author ia ON ia.item_id = i.item_id
      LEFT JOIN author a ON a.author_id = ia.author_id
      ${whereSql}
      GROUP BY i.item_id, i.title, i.subject, i.classification,
               b.isbn, b.publisher, b.publication_year,
               d.model, d.manufacturer,
               m.media_type, m.length_minutes, m.publisher, m.publication_year
      ORDER BY i.item_id DESC
      LIMIT 200
    `;

    const [rows] = await pool.query(sql, params);
    console.log(`[DEBUG] Search query: "${q}", Found ${rows.length} results`);
    if (rows.length > 0) console.log('[DEBUG] First result:', rows[0]);
    // normalize authors to array and merge publisher/year fields
    const out = rows.map((r) => ({
      item_id: r.item_id,
      title: r.title,
      subject: r.subject,
      classification: r.classification,
      item_type: r.item_type,
      isbn: r.isbn,
      publisher: r.book_publisher || r.media_publisher,
      publication_year: r.book_year || r.media_year,
      model: r.model,
      manufacturer: r.manufacturer,
      media_type: r.media_type,
      length_minutes: r.length_minutes,
      authors: typeof r.authors === "string" && r.authors.length ? r.authors.split(/\s*,\s*/) : [],
    }));
    return sendJSON(res, 200, out);
  } catch (err) {
    return sendJSON(res, 500, { error: "items_list_failed", details: err.message });
  }
};

// List copies for a given item_id for browse/checkout flows
export const listItemCopies = () => async (_req, res, params) => {
  const itemId = Number(params.id);
  if (!itemId) return sendJSON(res, 400, { error: "invalid_item_id" });
  try {
    const [rows] = await pool.query(
      `SELECT c.copy_id, c.barcode, c.status, c.shelf_location, c.acquired_at
       FROM copy c
       WHERE c.item_id = ?
       ORDER BY (c.status = 'available') DESC, c.copy_id ASC
       LIMIT 500`,
      [itemId]
    );
    return sendJSON(res, 200, rows);
  } catch (err) {
    return sendJSON(res, 500, { error: "copies_list_failed", details: err.message });
  }
};

export const createItem = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  console.log('[DEBUG] Creating item with payload:', JSON.stringify(b, null, 2));
  const title = (b.title||"").trim();
  if (!title) return sendJSON(res, 400, { error:"title_required" });
  const subject = (b.subject || "").trim() || null;
  const classification = (b.classification || "").trim() || null;

  const itemType = typeof b.item_type === "string" ? b.item_type.trim().toLowerCase() : "";
  console.log('[DEBUG] Item type:', itemType);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [itemResult] = await conn.execute(
      "INSERT INTO item(title, subject, classification) VALUES(?,?,?)",
      [title, subject, classification]
    );
    const item_id = itemResult.insertId;
    console.log('[DEBUG] Created item with ID:', item_id);

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
    console.log('[DEBUG] Item creation successful, returning item_id:', item_id);
    return sendJSON(res, 201, { item_id });
  } catch (err) {
    console.error('[ERROR] Item creation failed:', err.message, err);
    try { await conn.rollback(); } catch {}
    return sendJSON(res, 400, { error: "item_create_failed", details: err.message });
  } finally {
    conn.release();
  }
};

export const updateItem = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); if (!auth) return;
  const b = await readJSONBody(req);
  const itemId = Number(params.id);
  
  await pool.execute(
    "UPDATE item SET title=COALESCE(?,title), subject=COALESCE(?,subject), classification=COALESCE(?,classification) WHERE item_id=?",
    [b.title||null, b.subject||null, b.classification||null, itemId]
  );
  
  return sendJSON(res, 200, { ok:true });
};

export const deleteItem = (JWT_SECRET) => async (req, res, params) => {
  const auth = requireAuth(req, res, JWT_SECRET); 
  if (!auth) return;
  
  const itemId = Number(params.id);
  if (!itemId || isNaN(itemId)) {
    return sendJSON(res, 400, { error: "invalid_id", message: "Invalid item ID" });
  }

  try {
    // Check if item exists
    const [items] = await pool.execute("SELECT item_id, title FROM item WHERE item_id = ?", [itemId]);
    if (items.length === 0) {
      return sendJSON(res, 404, { error: "not_found", message: "Item not found" });
    }

    // Check for active loans on any copies of this item
    const [activeLoans] = await pool.execute(
      `SELECT COUNT(*) as count FROM loan l 
       JOIN copy c ON l.copy_id = c.copy_id 
       WHERE c.item_id = ? AND l.status = 'active'`,
      [itemId]
    );

    if (activeLoans[0].count > 0) {
      return sendJSON(res, 409, { 
        error: "has_active_loans", 
        message: `Cannot delete item: ${activeLoans[0].count} active loan(s) exist. Return all copies before deleting.` 
      });
    }

    // Delete in order to respect foreign key constraints:
    // 1. Delete from item_author junction table
    await pool.execute("DELETE FROM item_author WHERE item_id = ?", [itemId]);
    
    // 2. Delete type-specific records (book, device, media)
    await pool.execute("DELETE FROM book WHERE item_id = ?", [itemId]);
    await pool.execute("DELETE FROM device WHERE item_id = ?", [itemId]);
    await pool.execute("DELETE FROM media WHERE item_id = ?", [itemId]);
    
    // 3. Delete fines associated with loans of copies of this item
    await pool.execute(
      `DELETE f FROM fine f 
       JOIN loan l ON f.loan_id = l.loan_id 
       JOIN copy c ON l.copy_id = c.copy_id 
       WHERE c.item_id = ?`,
      [itemId]
    );
    
    // 4. Delete loans associated with copies of this item
    await pool.execute(
      `DELETE l FROM loan l 
       JOIN copy c ON l.copy_id = c.copy_id 
       WHERE c.item_id = ?`,
      [itemId]
    );
    
    // 5. Delete all copies
    await pool.execute("DELETE FROM copy WHERE item_id = ?", [itemId]);
    
    // 6. Finally delete the item itself
    await pool.execute("DELETE FROM item WHERE item_id = ?", [itemId]);

    return sendJSON(res, 200, { ok: true, message: "Item deleted successfully" });
  } catch (err) {
    console.error("Delete item error:", err);
    return sendJSON(res, 500, { 
      error: "server_error", 
      message: err.message || "Failed to delete item" 
    });
  }
};
