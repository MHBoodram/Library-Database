import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { setCors, sendJSON } from "./lib/http.js";
import { router } from "./lib/router.js";

import { register, login } from "./api/auth.js";
import { createItem, updateItem, deleteItem, listItems, listItemCopies } from "./api/items.js";
import { createCopy, updateCopy, deleteCopy } from "./api/copies.js";
import { checkout, returnLoan, fetchUserLoans } from "./api/loans.js";
import { placeHold, cancelHold } from "./api/holds.js";
import { overdue, balances, topItems, newPatronsByMonth } from "./api/reports.js";
import { listFines, listActiveLoans } from "./api/staff.js";
import {
  createReservation,
  listReservations,
  createReservationSelf,
  listMyReservations,
  cancelReservation,
  deleteReservation,
} from "./api/reservations.js";
import { createRoom, listRooms } from "./api/rooms.js";
import { createAuthor, getItemAuthors, deleteItemAuthor } from "./api/authors.js";
import { adminOverview, listEmployees as adminEmployees, createAccount as adminCreateAccount } from "./api/admin.js";
import { getProfile, updateProfile } from "./api/profile.js";
import { listAccounts, updateAccount as updateManagedAccount, flagAccount } from "./api/manageAcc.js";

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

const r = router();

r.add("GET", "/api/health", async (_req, res) => sendJSON(res, 200, { ok: true, node: process.version }));

r.add("POST", "/api/auth/register", register());
r.add("POST", "/api/auth/login", login(JWT_SECRET));

r.add("GET", "/api/items", listItems());
r.add("GET", "/api/items/:id/copies", listItemCopies());
r.add("POST", "/api/items", createItem(JWT_SECRET));
r.add("PUT", "/api/items/:id", updateItem(JWT_SECRET));
r.add("DELETE", "/api/items/:id", deleteItem(JWT_SECRET));

r.add("POST", "/api/authors", createAuthor(JWT_SECRET));
r.add("GET", "/api/items/:id/authors", getItemAuthors());
r.add("DELETE", "/api/items/:id/authors/:author_id", deleteItemAuthor(JWT_SECRET));

r.add("POST", "/api/copies", createCopy(JWT_SECRET));
r.add("PUT", "/api/copies/:id", updateCopy(JWT_SECRET));
r.add("DELETE", "/api/copies/:id", deleteCopy(JWT_SECRET));

r.add("POST", "/api/loans/checkout", checkout(JWT_SECRET));
r.add("POST", "/api/loans/return", returnLoan(JWT_SECRET));
r.add("GET", "/api/loans/my", fetchUserLoans(JWT_SECRET));

r.add("POST", "/api/holds/place", placeHold(JWT_SECRET));
r.add("DELETE", "/api/holds/:id", cancelHold(JWT_SECRET));

r.add("GET", "/api/reports/overdue", overdue(JWT_SECRET));
r.add("GET", "/api/reports/balances", balances(JWT_SECRET));
r.add("GET", "/api/reports/top-items", topItems(JWT_SECRET));
r.add("GET", "/api/reports/new-patrons-monthly", newPatronsByMonth(JWT_SECRET));

r.add("GET", "/api/admin/overview", adminOverview(JWT_SECRET));
r.add("GET", "/api/admin/employees", adminEmployees(JWT_SECRET));
r.add("POST", "/api/admin/accounts", adminCreateAccount(JWT_SECRET));

r.add("GET", "/api/me", getProfile(JWT_SECRET));
r.add("PATCH", "/api/me", updateProfile(JWT_SECRET));

r.add("GET", "/api/staff/fines", listFines(JWT_SECRET));
r.add("GET", "/api/staff/loans/active", listActiveLoans(JWT_SECRET));
r.add("GET", "/api/staff/reservations", listReservations(JWT_SECRET));
r.add("POST", "/api/staff/reservations", createReservation(JWT_SECRET));
r.add("DELETE", "/api/staff/reservations/:id", deleteReservation(JWT_SECRET));
r.add("POST", "/api/staff/rooms", createRoom(JWT_SECRET));

r.add("GET", "/api/manage/accounts", listAccounts(JWT_SECRET));
r.add("PATCH", "/api/manage/accounts/:id", updateManagedAccount(JWT_SECRET));
r.add("POST", "/api/manage/accounts/:id/flag", flagAccount(JWT_SECRET));

r.add("POST", "/api/reservations", createReservationSelf(JWT_SECRET));
r.add("GET", "/api/reservations/my", listMyReservations(JWT_SECRET));
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

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
