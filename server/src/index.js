import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { setCors, sendJSON } from "./lib/http.js";
import { router } from "./lib/router.js";

import { register, login } from "./api/auth.js";
import { createItem, updateItem, deleteItem, listItems } from "./api/items.js";
import { createCopy, updateCopy, deleteCopy } from "./api/copies.js";
import { checkout, returnLoan } from "./api/loans.js";
import { placeHold, cancelHold } from "./api/holds.js";
import { overdue, balances, topItems } from "./api/reports.js";
import { listFines, listActiveLoans } from "./api/staff.js";
import { createReservation, listReservations } from "./api/reservations.js";
import { createRoom } from "./api/rooms.js";

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// router
const r = router();

// health
r.add("GET", "/api/health", async (_req, res) => sendJSON(res, 200, { ok:true, node: process.version }));

// auth
r.add("POST", "/api/auth/register", register());
r.add("POST", "/api/auth/login",    login(JWT_SECRET));
// (optional) r.add("GET", "/api/auth/me", me(JWT_SECRET));

// items
r.add("GET",    "/api/items",     listItems());
r.add("POST",   "/api/items",     createItem(JWT_SECRET));
r.add("PUT",    "/api/items/:id", updateItem(JWT_SECRET));
r.add("DELETE", "/api/items/:id", deleteItem(JWT_SECRET));

// copies
r.add("POST",   "/api/copies",     createCopy(JWT_SECRET));
r.add("PUT",    "/api/copies/:id", updateCopy(JWT_SECRET));
r.add("DELETE", "/api/copies/:id", deleteCopy(JWT_SECRET));

// loans 
r.add("POST", "/api/loans/checkout", checkout(JWT_SECRET));
r.add("POST", "/api/loans/return",   returnLoan(JWT_SECRET));

// holds
r.add("POST",   "/api/holds/place",  placeHold(JWT_SECRET));
r.add("DELETE", "/api/holds/:id",    cancelHold(JWT_SECRET));

// reports (staff only)
r.add("GET", "/api/reports/overdue",    overdue(JWT_SECRET));
r.add("GET", "/api/reports/balances",   balances(JWT_SECRET));
r.add("GET", "/api/reports/top-items",  topItems(JWT_SECRET));

// staff tools
r.add("GET", "/api/staff/fines", listFines(JWT_SECRET));
r.add("GET", "/api/staff/loans/active", listActiveLoans(JWT_SECRET));
r.add("GET", "/api/staff/reservations", listReservations(JWT_SECRET));
r.add("POST", "/api/staff/reservations", createReservation(JWT_SECRET));
r.add("POST", "/api/staff/rooms", createRoom(JWT_SECRET));

// server
const server = http.createServer(async (req, res) => {
  if (setCors(req, res)) return;  // CORS & preflight first

  const url = new URL(req.url, `http://${req.headers.host}`);
  const m = r.match(req.method, url.pathname);
  if (!m) return sendJSON(res, 404, { error: "not_found" });

  try { await m.handler(req, res, m.params); }
  catch (e) { console.error("Server error:", e); sendJSON(res, 500, { error: "server_error" }); }
});


server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
