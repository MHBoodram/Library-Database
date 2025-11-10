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

  /**
   * Get all authors for a specific item
   * GET /api/items/:id/authors
   */
  export function getItemAuthors() {
    return async (req, res, params) => {
      try {
        const itemId = Number(params.id);
        if (!itemId || isNaN(itemId)) {
          return sendJSON(res, 400, { error: "invalid_item_id" });
        }

        // Query authors linked to this item
        const [authors] = await pool.query(
          `SELECT a.author_id, a.full_name as author_name
           FROM author a
           JOIN item_author ia ON a.author_id = ia.author_id
           WHERE ia.item_id = ?
           ORDER BY a.full_name ASC`,
          [itemId]
        );

        return sendJSON(res, 200, authors);
      } catch (error) {
        console.error("Error fetching item authors:", error);
        return sendJSON(res, 500, { error: "server_error" });
      }
    };
  }

  /**
   * Delete an author link from an item
   * DELETE /api/items/:id/authors/:author_id
   */
  export function deleteItemAuthor(JWT_SECRET) {
    return async (req, res, params) => {
      try {
        // Require staff role
        const auth = requireRole(req, res, JWT_SECRET, "staff");
        if (!auth) return;

        const itemId = Number(params.id);
        const authorId = Number(params.author_id);

        if (!itemId || isNaN(itemId) || !authorId || isNaN(authorId)) {
          return sendJSON(res, 400, { error: "invalid_ids" });
        }

        // Delete the link from item_author table
        const [result] = await pool.query(
          "DELETE FROM item_author WHERE item_id = ? AND author_id = ?",
          [itemId, authorId]
        );

        if (result.affectedRows === 0) {
          return sendJSON(res, 404, { error: "link_not_found" });
        }

        return sendJSON(res, 200, { ok: true, message: "Author link deleted successfully" });
      } catch (error) {
        console.error("Error deleting item author:", error);
        return sendJSON(res, 500, { error: "server_error" });
      }
    };
  }
