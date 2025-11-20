import { pool } from "./db.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  createNotification,
  notificationExists,
} from "./notifications.js";

const DUE_SOON_HOURS = Number(process.env.LOAN_DUE_SOON_HOURS || 48);
const LOST_AFTER_DAYS = Number(process.env.LOAN_LOST_AFTER_DAYS || 15);
const LOST_SUSPEND_GRACE_DAYS = Number(process.env.LOST_SUSPEND_GRACE_DAYS || 3);
const ROOM_EXPIRING_MINUTES = Number(process.env.ROOM_EXPIRING_MINUTES || 30);

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function iso(input) {
  return input instanceof Date ? input.toISOString() : new Date(input).toISOString();
}

export async function sweepLoanNotifications() {
  const conn = await pool.getConnection();
  try {
    const now = new Date();
    const dueSoonAt = hoursFromNow(DUE_SOON_HOURS);
    const lostCutoff = hoursFromNow(-24 * LOST_AFTER_DAYS);
    const suspendCutoff = hoursFromNow(-24 * (LOST_AFTER_DAYS + LOST_SUSPEND_GRACE_DAYS));

    const [loans] = await conn.query(
      `
        SELECT l.loan_id, l.user_id, l.due_date, l.status, l.return_date,
               i.title AS item_title
        FROM loan l
        JOIN copy c ON c.copy_id = l.copy_id
        JOIN item i ON i.item_id = c.item_id
        WHERE l.status = 'active'
      `
    );

    for (const loan of loans) {
      const due = loan.due_date ? new Date(loan.due_date) : null;
      if (!due || Number.isNaN(due.getTime())) continue;
      const meta = { loan_id: loan.loan_id, due_date: iso(due), item_title: loan.item_title };

      // due soon
      if (due > now && due <= dueSoonAt) {
        const exists = await notificationExists(conn, {
          userId: loan.user_id,
          type: NOTIFICATION_TYPES.DUE_SOON,
          hint: `"loan_id":${loan.loan_id}`,
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

      // overdue
      if (due < now && due > lostCutoff) {
        const exists = await notificationExists(conn, {
          userId: loan.user_id,
          type: NOTIFICATION_TYPES.OVERDUE,
          hint: `"loan_id":${loan.loan_id}`,
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

      // lost threshold reached
      if (due <= lostCutoff) {
        const lostExists = await notificationExists(conn, {
          userId: loan.user_id,
          type: NOTIFICATION_TYPES.LOST_MARKED,
          hint: `"loan_id":${loan.loan_id}`,
        });
        if (!lostExists) {
          await createNotification(conn, {
            userId: loan.user_id,
            type: NOTIFICATION_TYPES.LOST_MARKED,
            title: `Marked lost: ${loan.item_title}`,
            message: `This item has been marked lost. A replacement fee may apply.`,
            metadata: meta,
          });
        }

        // Lost warning / suspension countdown
        const suspendExists = await notificationExists(conn, {
          userId: loan.user_id,
          type: NOTIFICATION_TYPES.LOST_WARNING,
          hint: `"loan_id":${loan.loan_id}`,
        });
        if (!suspendExists) {
          await createNotification(conn, {
            userId: loan.user_id,
            type: NOTIFICATION_TYPES.LOST_WARNING,
            title: `Account warning for lost item`,
            message: `Please pay the lost fee within ${LOST_SUSPEND_GRACE_DAYS} days to avoid suspension.`,
            actionRequired: true,
            metadata: { ...meta, suspend_after: iso(hoursFromNow(24 * LOST_SUSPEND_GRACE_DAYS)) },
          });
        }

        if (due <= suspendCutoff) {
          const suspended = await notificationExists(conn, {
            userId: loan.user_id,
            type: NOTIFICATION_TYPES.SUSPENDED,
            hint: `"loan_id":${loan.loan_id}`,
          });
          if (!suspended) {
            await createNotification(conn, {
              userId: loan.user_id,
              type: NOTIFICATION_TYPES.SUSPENDED,
              title: `Account suspended`,
              message: `Your account has been temporarily suspended due to unpaid lost item fees.`,
              actionRequired: true,
              metadata: meta,
            });
          }
        }
      }
    }
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
          hint: `"reservation_id":${res.reservation_id}`,
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
          hint: `"reservation_id":${res.reservation_id}`,
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
      }
    }
  } catch (err) {
    console.error("[sweepRoomNotifications] failed:", err);
  } finally {
    conn.release();
  }
}
