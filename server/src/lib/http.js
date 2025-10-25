// Shared HTTP + auth helpers
import jwt from "jsonwebtoken";

export function setCors(res, origin, allowed = [
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "http://localhost:5174",
]) {
  if (!origin || allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || allowed[0]);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
}

export function sendJSON(res, code, data) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export async function readJSONBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

export function getAuthUser(req, secret) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, secret); } catch { return null; }
}

export function requireAuth(req, res, secret) {
  const user = getAuthUser(req, secret);
  if (!user) { sendJSON(res, 401, { error: "unauthorized" }); return null; }
  return user;
}

export function requireRole(req, res, secret, role) {
  const user = requireAuth(req, res, secret);
  if (!user) return null;
  if (user.role !== role) { sendJSON(res, 403, { error: "forbidden" }); return null; }
  return user;
}
