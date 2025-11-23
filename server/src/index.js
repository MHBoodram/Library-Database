import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { setCors, sendJSON, getAuthUser } from "./lib/http.js";
import { router } from "./lib/router.js";
import { pool } from "./lib/db.js";
import { expireReadyHolds, assignAvailableCopies } from "./lib/holdQueue.js";

import { login } from "./api/auth.js";
import { createItem, updateItem, deleteItem, listItems, listItemCopies } from "./api/items.js";
import { createCopy, updateCopy, deleteCopy } from "./api/copies.js";
import { checkout, returnLoan, fetchUserLoans } from "./api/loans.js";
import { placeHold, cancelHold, listHolds, acceptHold, declineHold } from "./api/holds.js";
import { overdue, balances, topItems, topItemsPublic, newPatronsByMonth, listTransactionsEvents } from "./api/reports.js";
import { listFines, listActiveLoans } from "./api/staff.js";
import {
  createReservation,
  listReservations,
  createReservationSelf,
  listMyReservations,
  cancelReservation,
  deleteReservation,
  getRoomAvailability,
  getRoomAvailabilityPatron,
} from "./api/reservations.js";
import { createRoom, listRooms } from "./api/rooms.js";
import { createAuthor, getItemAuthors, deleteItemAuthor } from "./api/authors.js";
import { adminOverview, listEmployees as adminEmployees, createAccount as adminCreateAccount, listAccountCreations, listAllActivity } from "./api/admin.js";
import { getProfile, updateProfile } from "./api/profile.js";
import { listAccounts, updateAccount as updateManagedAccount, flagAccount, clearFlagAccount } from "./api/manageAcc.js";
import { searchPatrons } from "./api/patrons.js";
import { updateRoom, deleteRoom } from "./api/rooms.js";
import { listMyFines,getTotalDue, payFine, payFinesTotal } from "./api/fines.js";
import { listNotifications, markNotificationRead, dismissNotification } from "./api/notifications.js";
import { sweepLoanNotifications, sweepRoomNotifications } from "./lib/notificationSweeps.js";

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

const r = router();

r.add("GET", "/api/health", async (_req, res) => sendJSON(res, 200, { ok: true, node: process.version }));

r.add("POST", "/api/auth/login", login(JWT_SECRET));

r.add("GET", "/api/items", listItems());
r.add("GET", "/api/items/:id/copies", listItemCopies());
r.add("POST", "/api/items", createItem(JWT_SECRET));
r.add("PUT", "/api/items/:id", updateItem(JWT_SECRET));
r.add("DELETE", "/api/items/:id", deleteItem(JWT_SECRET));

// Public endpoint for homepage featured books
r.add("GET", "/api/public/top-items", topItemsPublic());


r.add("POST", "/api/authors", createAuthor(JWT_SECRET));
r.add("GET", "/api/items/:id/authors", getItemAuthors());
r.add("DELETE", "/api/items/:id/authors/:author_id", deleteItemAuthor(JWT_SECRET));

r.add("POST", "/api/copies", createCopy(JWT_SECRET));
r.add("PUT", "/api/copies/:id", updateCopy(JWT_SECRET));
r.add("DELETE", "/api/copies/:id", deleteCopy(JWT_SECRET));

r.add("POST", "/api/loans/checkout", checkout(JWT_SECRET));
r.add("POST", "/api/loans/return", returnLoan(JWT_SECRET));
r.add("GET", "/api/loans/my", fetchUserLoans(JWT_SECRET,"active"));
r.add("GET", "/api/loans/myhist", fetchUserLoans(JWT_SECRET,"history"));

r.add("POST", "/api/holds/place", placeHold(JWT_SECRET));
r.add("GET", "/api/holds/my", listHolds(JWT_SECRET));
r.add("GET", "/api/staff/holds", listHolds(JWT_SECRET));
r.add("DELETE", "/api/holds/:id", cancelHold(JWT_SECRET));
r.add("POST", "/api/holds/:id/accept", acceptHold(JWT_SECRET));
r.add("POST", "/api/holds/:id/decline", declineHold(JWT_SECRET));
r.add("GET", "/api/notifications", listNotifications(JWT_SECRET));
r.add("POST", "/api/notifications/:id/read", markNotificationRead(JWT_SECRET));
r.add("POST", "/api/notifications/:id/dismiss", dismissNotification(JWT_SECRET));

r.add("GET", "/api/reports/overdue", overdue(JWT_SECRET));
r.add("GET", "/api/reports/balances", balances(JWT_SECRET));
r.add("GET", "/api/reports/top-items", topItems(JWT_SECRET));
r.add("GET", "/api/reports/new-patrons-monthly", newPatronsByMonth(JWT_SECRET));
r.add("GET","/api/reports/transactions",listTransactionsEvents(JWT_SECRET));

r.add("GET", "/api/admin/overview", adminOverview(JWT_SECRET));
r.add("GET", "/api/admin/employees", adminEmployees(JWT_SECRET));
r.add("POST", "/api/admin/accounts", adminCreateAccount(JWT_SECRET));
r.add("GET", "/api/admin/accounts/creations", listAccountCreations(JWT_SECRET));
r.add("GET", "/api/admin/activity", listAllActivity(JWT_SECRET));

r.add("GET", "/api/me", getProfile(JWT_SECRET));
r.add("PATCH", "/api/me", updateProfile(JWT_SECRET));

r.add("GET", "/api/staff/patrons/search", searchPatrons(JWT_SECRET));

r.add("GET", "/api/staff/fines", listFines(JWT_SECRET));
r.add("GET", "/api/staff/loans/active", listActiveLoans(JWT_SECRET));
r.add("GET", "/api/staff/reservations", listReservations(JWT_SECRET));
r.add("GET", "/api/staff/reservations/availability", getRoomAvailability(JWT_SECRET));
r.add("POST", "/api/staff/reservations", createReservation(JWT_SECRET));
r.add("DELETE", "/api/staff/reservations/:id", deleteReservation(JWT_SECRET));
r.add("POST", "/api/staff/rooms", createRoom(JWT_SECRET));
r.add("PUT", "/api/staff/rooms/:id", updateRoom(JWT_SECRET));
r.add("DELETE", "/api/staff/rooms/:id", deleteRoom(JWT_SECRET));

r.add("GET", "/api/manage/accounts", listAccounts(JWT_SECRET));
r.add("PATCH", "/api/manage/accounts/:id", updateManagedAccount(JWT_SECRET));
r.add("POST", "/api/manage/accounts/:id/flag", flagAccount(JWT_SECRET));
r.add("DELETE", "/api/manage/accounts/:id/flag", clearFlagAccount(JWT_SECRET));

r.add("GET", "/api/fines/my", listMyFines(JWT_SECRET));
r.add("GET", "/api/fines/total", getTotalDue(JWT_SECRET));
r.add("POST", "/api/fines/pay", payFine(JWT_SECRET));
r.add("POST", "/api/fines/pay-total", payFinesTotal(JWT_SECRET));

r.add("POST", "/api/reservations", createReservationSelf(JWT_SECRET));
r.add("GET", "/api/reservations/my", listMyReservations(JWT_SECRET));
r.add("GET", "/api/reservations/availability", getRoomAvailabilityPatron(JWT_SECRET));
r.add("PATCH", "/api/reservations/:id/cancel", cancelReservation(JWT_SECRET));

r.add("GET", "/api/rooms", listRooms());

const server = http.createServer(async (req, res) => {
  if (setCors(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = r.match(req.method, url.pathname);
  if (!match) return sendJSON(res, 404, { error: "not_found" });

  try {
    await match.handler(req, res, match.params);
  } catch (err) {
    console.error("Server error:", err);
    sendJSON(res, 500, { error: "server_error" });
  }
});

const HOLD_EXPIRY_SWEEP_MS = Number(process.env.HOLD_EXPIRY_SWEEP_MS || 5 * 60 * 1000);
const LOAN_SWEEP_MS = Number(process.env.LOAN_SWEEP_MS || 60 * 60 * 1000);
const ROOM_SWEEP_MS = Number(process.env.ROOM_SWEEP_MS || 10 * 60 * 1000);
async function runHoldExpirySweep() {
  if (runHoldExpirySweep.running) return;
  runHoldExpirySweep.running = true;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const expired = await expireReadyHolds(conn);
    const assigned = await assignAvailableCopies(conn);
    await conn.commit();
    if (expired) {
      console.log(`Expired ${expired} ready hold(s)`);
    }
    if (assigned) {
      console.log(`Assigned ${assigned} available copy/copies to queued holds`);
    }
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("Hold expiry sweep failed:", err);
  } finally {
    conn.release();
    runHoldExpirySweep.running = false;
  }
}
const expiryInterval = setInterval(runHoldExpirySweep, HOLD_EXPIRY_SWEEP_MS);
if (typeof expiryInterval.unref === "function") {
  expiryInterval.unref();
}
runHoldExpirySweep().catch((err) => console.error("Initial hold sweep failed:", err));

async function runLoanSweep() {
  if (runLoanSweep.running) return;
  runLoanSweep.running = true;
  try {
    await sweepLoanNotifications();
  } catch (err) {
    console.error("Loan sweep failed:", err);
  } finally {
    runLoanSweep.running = false;
  }
}
const loanInterval = setInterval(runLoanSweep, LOAN_SWEEP_MS);
if (typeof loanInterval.unref === "function") loanInterval.unref();
runLoanSweep().catch((err) => console.error("Initial loan sweep failed:", err));

async function runRoomSweep() {
  if (runRoomSweep.running) return;
  runRoomSweep.running = true;
  try {
    await sweepRoomNotifications();
  } catch (err) {
    console.error("Room sweep failed:", err);
  } finally {
    runRoomSweep.running = false;
  }
}
const roomInterval = setInterval(runRoomSweep, ROOM_SWEEP_MS);
if (typeof roomInterval.unref === "function") roomInterval.unref();
runRoomSweep().catch((err) => console.error("Initial room sweep failed:", err));

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
