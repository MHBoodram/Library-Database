import { pool } from "./db.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  createNotification,
  notificationExists,
} from "./notifications.js";

const DUE_SOON_HOURS = Number(process.env.LOAN_DUE_SOON_HOURS || 24);
const LOST_AFTER_DAYS = Number(process.env.LOAN_LOST_AFTER_DAYS || 28);
const LOST_SUSPEND_GRACE_DAYS = Number(process.env.LOST_SUSPEND_GRACE_DAYS || 3);
const LOST_REPLACEMENT_FEE = Number(process.env.LOST_REPLACEMENT_FEE || 20);
const ROOM_EXPIRING_MINUTES = Number(process.env.ROOM_EXPIRING_MINUTES || 15);
const LOST_WARNING_DAYS_BEFORE_LOST = Number(process.env.LOST_WARNING_DAYS_BEFORE_LOST || 3);

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function iso(input) {
  return input instanceof Date ? input.toISOString() : new Date(input).toISOString();
}

async function markLoanAndCopyLost(conn, loan) {
  if (!loan?.loan_id || !loan?.copy_id) return;
  if (loan.status !== "lost") {
    await conn.execute(
      "UPDATE loan SET status = 'lost' WHERE loan_id = ? AND status <> 'lost'",
      [loan.loan_id]
    );
  }
  await conn.execute(
    "UPDATE copy SET status = 'lost' WHERE copy_id = ? AND status <> 'lost'",
    [loan.copy_id]
  );
}

async function ensureLostFine(conn, loan) {
  if (!loan?.loan_id || !loan?.user_id) return;
  const [existing] = await conn.query(
    `
      SELECT fine_id, reason, amount_assessed
      FROM fine
      WHERE loan_id = ?
        AND status NOT IN ('paid','waived','written_off')
      ORDER BY fine_id ASC
    `,
    [loan.loan_id]
  );
  const targetAmount = LOST_REPLACEMENT_FEE;
  const lostFine = existing.find((row) => row.reason === "lost");
  if (lostFine) {
    if (Number(lostFine.amount_assessed) !== targetAmount) {
      await conn.execute(
        "UPDATE fine SET amount_assessed = ? WHERE fine_id = ?",
        [targetAmount, lostFine.fine_id]
      );
    }
    return;
  }

  // If a lost fine ever existed for this loan (even if now paid/waived/written_off),
  // do not create another one. This prevents duplicate lost fines after payment.
  const [historicalLost] = await conn.query(
    `
      SELECT fine_id
      FROM fine
      WHERE loan_id = ?
        AND reason = 'lost'
      LIMIT 1
    `,
    [loan.loan_id]
  );
  if (historicalLost.length > 0) {
    return;
  }

  const overdueFine = existing.find((row) => row.reason === "overdue");
  if (overdueFine) {
    await conn.execute(
      "UPDATE fine SET reason = 'lost', amount_assessed = ? WHERE fine_id = ?",
      [targetAmount, overdueFine.fine_id]
    );
    return;
  }
  await conn.execute(
    `
      INSERT INTO fine (loan_id, user_id, assessed_at, reason, amount_assessed, status)
      VALUES (?, ?, NOW(), 'lost', ?, 'open')
    `,
    [loan.loan_id, loan.user_id, targetAmount]
  );
}

export async function sweepLoanNotifications() {
  const conn = await pool.getConnection();
  try {
    const now = new Date();
    const dueSoonAt = hoursFromNow(DUE_SOON_HOURS);
    const lostCutoff = hoursFromNow(-24 * LOST_AFTER_DAYS);
    const lostWarningStart = hoursFromNow(-24 * (LOST_AFTER_DAYS - LOST_WARNING_DAYS_BEFORE_LOST));

    const [loans] = await conn.query(
      `
        SELECT l.loan_id, l.user_id, l.copy_id, l.due_date, l.status, l.return_date,
               i.title AS item_title
        FROM loan l
        JOIN copy c ON c.copy_id = l.copy_id
        JOIN item i ON i.item_id = c.item_id
        WHERE l.status IN ('active','lost')
      `
    );

    for (const loan of loans) {
      const due = loan.due_date ? new Date(loan.due_date) : null;
      if (!due || Number.isNaN(due.getTime())) continue;
      const meta = { loan_id: loan.loan_id, due_date: iso(due), item_title: loan.item_title };

      const isActiveLoan = loan.status === "active";

      // due soon (active loans only)
      if (isActiveLoan && due > now && due <= dueSoonAt) {
        const exists = await notificationExists(conn, {
          userId: loan.user_id,
          type: NOTIFICATION_TYPES.DUE_SOON,
          uniqueField: 'loan_id',
          uniqueValue: loan.loan_id,
        });
        if (!exists) {
          await createNotification(conn, {
            userId: loan.user_id,
            type: NOTIFICATION_TYPES.DUE_SOON,
            title: `Due soon: ${loan.item_title}`,
            message: `Your loan is due on ${due.toLocaleString()}.`,
            metadata: meta,
          });
        }
        continue;
      }

      // overdue (active loans only)
      if (isActiveLoan && due < now && due > lostCutoff) {
        const exists = await notificationExists(conn, {
          userId: loan.user_id,
          type: NOTIFICATION_TYPES.OVERDUE,
          uniqueField: 'loan_id',
          uniqueValue: loan.loan_id,
        });
        if (!exists) {
          await createNotification(conn, {
            userId: loan.user_id,
            type: NOTIFICATION_TYPES.OVERDUE,
            title: `Overdue: ${loan.item_title}`,
            message: `Your loan is overdue. Please return it as soon as possible.`,
            metadata: meta,
          });
        }
        continue;
      }

      // lost warning window (before lost cutoff)
      if (isActiveLoan && due < now && due <= lostWarningStart && due > lostCutoff) {
        const warnExists = await notificationExists(conn, {
          userId: loan.user_id,
          type: NOTIFICATION_TYPES.LOST_WARNING,
          uniqueField: 'loan_id',
          uniqueValue: loan.loan_id,
        });
        if (!warnExists) {
          await createNotification(conn, {
            userId: loan.user_id,
            type: NOTIFICATION_TYPES.LOST_WARNING,
            title: `At risk of lost: ${loan.item_title}`,
            message: `This item is overdue and will be marked lost soon. Please return it or pay the replacement fee.`,
            actionRequired: true,
            metadata: meta,
          });
        }
      }

      // lost threshold reached
      if (due <= lostCutoff) {
        await markLoanAndCopyLost(conn, loan);
        await ensureLostFine(conn, loan);
        // No longer emitting lost_marked or suspended notifications.
      }
    }

    // Auto-resolve lost warnings if account is active (no suspensions emitted)
    await conn.execute(
      `
        UPDATE notification n
        JOIN account a ON a.user_id = n.user_id
        SET
          n.status = 'resolved',
          n.read_at = COALESCE(n.read_at, NOW()),
          n.resolved_at = NOW()
        WHERE n.type = 'lost_warning'
          AND n.status <> 'resolved'
          AND a.is_active = 1
      `
    );
  } catch (err) {
    console.error("[sweepLoanNotifications] failed:", err);
  } finally {
    conn.release();
  }
}

export async function sweepRoomNotifications() {
  const conn = await pool.getConnection();
  try {
    const now = new Date();
    const expiringAt = minutesFromNow(ROOM_EXPIRING_MINUTES);

    const [rows] = await conn.query(
      `
        SELECT r.reservation_id, r.user_id, r.room_id, r.start_time, r.end_time, r.status, rm.room_number
        FROM reservation r
        JOIN room rm ON rm.room_id = r.room_id
        WHERE r.status = 'active'
      `
    );

    for (const res of rows) {
      const start = new Date(res.start_time);
      const end = new Date(res.end_time);
      const meta = {
        reservation_id: res.reservation_id,
        room_id: res.room_id,
        room_number: res.room_number,
        start_time: iso(start),
        end_time: iso(end),
      };

      if (end > now && end <= expiringAt) {
        const exists = await notificationExists(conn, {
          userId: res.user_id,
          type: NOTIFICATION_TYPES.ROOM_EXPIRING,
          uniqueField: 'reservation_id',
          uniqueValue: res.reservation_id,
        });
        if (!exists) {
          await createNotification(conn, {
            userId: res.user_id,
            type: NOTIFICATION_TYPES.ROOM_EXPIRING,
            title: `Room ending soon`,
            message: `Your reservation for room ${res.room_number} ends at ${end.toLocaleTimeString()}.`,
            metadata: meta,
          });
        }
        continue;
      }

      if (end <= now) {
        const exists = await notificationExists(conn, {
          userId: res.user_id,
          type: NOTIFICATION_TYPES.ROOM_EXPIRED,
          uniqueField: 'reservation_id',
          uniqueValue: res.reservation_id,
        });
        if (!exists) {
          await createNotification(conn, {
            userId: res.user_id,
            type: NOTIFICATION_TYPES.ROOM_EXPIRED,
            title: `Room reservation ended`,
            message: `Your reservation for room ${res.room_number} has ended.`,
            metadata: meta,
          });
        }

        // Mark the reservation as completed so we don't keep reprocessing it
        if (res.status === 'active') {
          await conn.execute(
            "UPDATE reservation SET status = 'completed' WHERE reservation_id = ? AND status = 'active'",
            [res.reservation_id]
          );
        }
      }
    }
  } catch (err) {
    console.error("[sweepRoomNotifications] failed:", err);
  } finally {
    conn.release();
  }
}
