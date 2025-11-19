export function createAppError(appCode, message, status = 400) {
  const err = new Error(message);
  err.appCode = appCode;
  err.status = status;
  return err;
}

export function determineLoanLimit(role) {
  const normalized = (role || "").toLowerCase();
  if (normalized === "faculty") return 7;
  return 5;
}

export function defaultLoanDays(role) {
  const normalized = (role || "").toLowerCase();
  if (normalized === "faculty") return 21;
  return 14;
}

export function getDueDateISO(days) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() + (Number.isFinite(days) ? days : 14));
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePolicyMediaType(raw) {
  const value = (raw || "").toLowerCase();
  if (!value) return "book";
  if (value === "device") return "device";
  if (value === "dvd") return "dvd";
  if (value === "blu-ray" || value === "bluray") return "dvd";
  if (value === "cd") return "other";
  if (value === "book") return "book";
  if (value === "other") return "other";
  return "book";
}

export async function resolvePolicy(conn, itemId, userCategory) {
  const policyMediaType = normalizePolicyMediaType(await lookupMediaType(conn, itemId));
  try {
    const [policyRows] = await conn.query(
      `
        SELECT policy_id, media_type, loan_days, daily_rate, grace_days, max_fine, replacement_fee
        FROM fine_policy
        WHERE media_type = ? AND user_category = ?
        LIMIT 1
      `,
      [policyMediaType, userCategory]
    );
    if (policyRows.length) return policyRows[0];

    if (policyMediaType !== "other") {
      const [fallbackRows] = await conn.query(
        `
          SELECT policy_id, media_type, loan_days, daily_rate, grace_days, max_fine, replacement_fee
          FROM fine_policy
          WHERE media_type = 'other' AND user_category = ?
          LIMIT 1
        `,
        [userCategory]
      );
      if (fallbackRows.length) return fallbackRows[0];
    }
  } catch (err) {
    if (err && (err.code === "ER_NO_SUCH_TABLE" || /fine_policy/.test(String(err.message)))) {
      return { media_type: policyMediaType };
    }
    throw err;
  }

  return { media_type: policyMediaType };
}

export async function insertLoanRecord(conn, { user_id, copy_id, employee_id, dueDate, policy }) {
  try {
    const [res] = await conn.execute(
      `
        INSERT INTO loan (
          user_id,
          copy_id,
          employee_id,
          policy_id,
          checkout_date,
          due_date,
          status,
          daily_fine_rate_snapshot,
          grace_days_snapshot,
          max_fine_snapshot,
          replacement_fee_snapshot
        )
        VALUES (
          ?, ?, ?, ?, NOW(), ?, 'active', ?, ?, ?, ?
        )
      `,
      [
        user_id,
        copy_id,
        employee_id,
        policy?.policy_id ?? null,
        dueDate,
        policy?.daily_rate ?? null,
        policy?.grace_days ?? null,
        policy?.max_fine ?? null,
        policy?.replacement_fee ?? null,
      ]
    );
    return res;
  } catch (err) {
    const message = String(err?.message || "");
    if (err?.code === "ER_BAD_FIELD_ERROR" || /Unknown column/i.test(message)) {
      const [fallbackRes] = await conn.execute(
        `
          INSERT INTO loan (
            user_id,
            copy_id,
            employee_id,
            checkout_date,
            due_date,
            status
          ) VALUES (
            ?, ?, ?, NOW(), ?, 'active'
          )
        `,
        [user_id, copy_id, employee_id, dueDate]
      );
      return fallbackRes;
    }
    throw err;
  }
}

async function lookupMediaType(conn, itemId) {
  const [rows] = await conn.query(
    `
      SELECT
        CASE
          WHEN d.item_id IS NOT NULL THEN 'device'
          WHEN m.item_id IS NOT NULL THEN LOWER(m.media_type)
          ELSE 'book'
        END AS media_type
      FROM item i
      LEFT JOIN device d ON d.item_id = i.item_id
      LEFT JOIN media m ON m.item_id = i.item_id
      WHERE i.item_id = ?
      LIMIT 1
    `,
    [itemId]
  );
  return rows[0]?.media_type || "book";
}
