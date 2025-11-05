import { sendJSON, readJSONBody, requireRole } from "../lib/http.js";
import { pool } from "../lib/db.js";

/**
 * Create a new author and link to an item
 * POST /api/authors
 * Body: { item_id: number, author_name: string }
 */
export function createAuthor(JWT_SECRET) {
  return async (req, res) => {
    try {
      // Require staff role
      const auth = requireRole(req, res, JWT_SECRET, "staff");
      if (!auth) return;

      const body = await readJSONBody(req);
      const { item_id, author_name } = body;

      if (!item_id || !author_name?.trim()) {
        return sendJSON(res, 400, { error: "item_id and author_name are required" });
      }

      const trimmedName = author_name.trim();

      // Check if item exists
      const [items] = await pool.query("SELECT item_id FROM item WHERE item_id = ?", [item_id]);
      if (items.length === 0) {
        return sendJSON(res, 404, { error: "Item not found" });
      }

      // Check if author already exists by name
      const [existingAuthors] = await pool.query(
        "SELECT author_id FROM author WHERE full_name = ?",
        [trimmedName]
      );

      let authorId;
      if (existingAuthors.length > 0) {
        // Author exists, use existing ID
        authorId = existingAuthors[0].author_id;
      } else {
        // Create new author
        const [result] = await pool.query(
          "INSERT INTO author (full_name) VALUES (?)",
          [trimmedName]
        );
        authorId = result.insertId;
      }

      // Check if this author is already linked to this item
      const [existingLinks] = await pool.query(
        "SELECT * FROM item_author WHERE item_id = ? AND author_id = ?",
        [item_id, authorId]
      );

      if (existingLinks.length > 0) {
        return sendJSON(res, 409, { error: "Author already linked to this item" });
      }

      // Link author to item
      await pool.query(
        "INSERT INTO item_author (item_id, author_id) VALUES (?, ?)",
        [item_id, authorId]
      );

      return sendJSON(res, 201, {
        message: "Author created and linked successfully",
        author_id: authorId,
        item_id: item_id,
      });
    } catch (error) {
      console.error("Error creating author:", error);
      return sendJSON(res, 500, { error: "server_error" });
    }
  };
}
