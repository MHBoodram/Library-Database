import { sendJSON, readJSONBody, requireAuth } from "../lib/http.js";
import { pool } from "../lib/db.js";

export const listAccounts = (JWT_SECRET) => async (req, res) => {
    const auth = requireAuth(req, res, JWT_SECRET,"staff"); if (!auth) return;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const validModes = ["all","fullname","firstname","lastname","email","id"]
    const mode = url.searchParams.get("mode");
    const term = (url.searchParams.get("term")||"").trim();
    const where = [];
    const params = [];
    if(!validModes.includes(mode)){
        return sendJSON(res, 400, { error:"invalid_payload", message: "Invalid search mode" });
    }
    switch(mode){
        case "fullname":
            where.push("CONCAT(u.first_name, ' ', u.last_name) LIKE ?");
            params.push(`%${term}%`);
            break;
        case "firstname":
            where.push("u.first_name LIKE ?");
            params.push(`%${term}%`);
            break;
        case "lastname":
            where.push("u.last_name LIKE ?");
            params.push(`%${term}%`);
            break;
        case "email":
            where.push("a.email LIKE ?");
            params.push(`%${term}%`);
            break;
        case "id":
            where.push("u.user_id = ?");
            params.push(term);
            break;
        case "all":
            where.push("(CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.first_name Like ? OR u.last_name like ? OR a.email LIKE ? OR u.user_id = ?)");
            params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
            break;
    }
    const whereLine = where.length ? "WHERE " + where.join(" AND ") : "";
    try{
        const sql = `
            SELECT u.user_id, u.first_name, u.last_name, a.email, a.role, a.created_at
            FROM user u
            INNER JOIN account a ON u.user_id = a.user_id
            ${whereLine}
            `;
            const [rows] = await pool.query(sql, params);
            const out = rows.map((r) => ({
            ...r,
            created_at: new Date(r.created_at).toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"})
            }));
            return sendJSON(res, 200, out);
    }catch (err){
        return sendJSON(res, 500, { error: "list_accounts_failed", details: err.message });
    }
}