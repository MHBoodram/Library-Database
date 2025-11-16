import { requireAuth, sendJSON, readJSONBody } from "../lib/http.js";
import { pool } from "../lib/db.js";

const isResolvedStatus = (status) => ["paid", "waived", "written_off"].includes(String(status || "").toLowerCase());

export const listMyFines = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  const userId = Number(auth.uid || auth.user_id || auth.userId || 0);
  if (!userId) return sendJSON(res, 400, { error: "invalid_user" });

  try {
    const [rows] = await pool.query(
      `
        SELECT
          f.fine_id,
          f.status,
          f.reason,
          f.assessed_at,
          f.amount_assessed,
          l.loan_id,
          l.due_date,
          i.title AS item_title,
          COALESCE((
            SELECT SUM(
              CASE 
                WHEN fp.type = 'refund' THEN -COALESCE(fp.amount, 0)
                ELSE COALESCE(fp.amount, 0)
              END
            )
            FROM fine_payment fp
            WHERE fp.fine_id = f.fine_id
          ), 0) AS amount_paid
        FROM fine f
        JOIN loan l ON l.loan_id = f.loan_id
        JOIN copy c ON c.copy_id = l.copy_id
        JOIN item i ON i.item_id = c.item_id
        WHERE f.user_id = ?
        ORDER BY f.assessed_at DESC, f.fine_id DESC
      `,
      [userId]
    );

    const normalized = rows.map((row) => {
      const assessed = Number(row.amount_assessed ?? 0);
      const paid = Number(row.amount_paid ?? 0);
      const outstanding = Math.max(0, Number((assessed - paid).toFixed(2)));
      return {
        ...row,
        amount_assessed: assessed,
        amount_paid: paid,
        outstanding,
        payable: outstanding > 0 && !isResolvedStatus(row.status),
      };
    });

    return sendJSON(res, 200, { rows: normalized });
  } catch (err) {
    console.error("Failed to list user fines:", err.message);
    return sendJSON(res, 500, { error: "fines_fetch_failed" });
  }
};

export const payFine = (JWT_SECRET) => async (req, res) => {
  const auth = requireAuth(req, res, JWT_SECRET);
  if (!auth) return;
  const body = await readJSONBody(req);
  const fineId = Number(body.fine_id);
  if (!Number.isInteger(fineId) || fineId <= 0) {
    return sendJSON(res, 400, { error: "invalid_fine" });
  }
  const userId = Number(auth.uid || auth.user_id || auth.userId || 0);
  if (!userId) return sendJSON(res, 400, { error: "invalid_user" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `
        SELECT
          f.fine_id,
          f.user_id,
          f.amount_assessed,
          f.status,
          COALESCE((
            SELECT SUM(
              CASE 
                WHEN fp.type = 'refund' THEN -COALESCE(fp.amount, 0)
                ELSE COALESCE(fp.amount, 0)
              END
            )
            FROM fine_payment fp
            WHERE fp.fine_id = f.fine_id
          ), 0) AS amount_paid
        FROM fine f
        WHERE f.fine_id = ?
        FOR UPDATE
      `,
      [fineId]
    );

    if (!rows.length) {
      await conn.rollback();
      return sendJSON(res, 404, { error: "fine_not_found" });
    }

    const fine = rows[0];
    if (Number(fine.user_id) !== userId) {
      await conn.rollback();
      return sendJSON(res, 403, { error: "forbidden" });
    }
    if (isResolvedStatus(fine.status)) {
      await conn.rollback();
      return sendJSON(res, 400, { error: "fine_already_settled" });
    }

    const assessed = Number(fine.amount_assessed ?? 0);
    const paid = Number(fine.amount_paid ?? 0);
    const outstanding = Number((assessed - paid).toFixed(2));
    if (outstanding <= 0) {
      await conn.rollback();
      return sendJSON(res, 400, { error: "fine_already_settled" });
    }

    await conn.execute(
      `
        INSERT INTO fine_payment (fine_id, employee_id, payment_at, amount, type, method, reference)
        VALUES (?, NULL, NOW(), ?, 'payment', 'online', NULL)
      `,
      [fineId, outstanding]
    );

    await conn.execute(
      "UPDATE fine SET status = 'paid' WHERE fine_id = ?",
      [fineId]
    );

    await conn.commit();

    return sendJSON(res, 200, {
      fine_id: fineId,
      status: "paid",
      amount_paid: outstanding,
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Failed to pay fine:", err.message);
    return sendJSON(res, 500, { error: "fine_payment_failed" });
  } finally {
    conn.release();
  }
};
