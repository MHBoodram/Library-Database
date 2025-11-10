// Shared HTTP + auth helpers
import jwt from "jsonwebtoken";

export function setCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS ||
    "https://library-database-xi.vercel.app,http://localhost:5173,http://localhost:5174"
  ).split(",").map(s => s.trim()).filter(Boolean);

  const origin = req.headers.origin;

  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] || "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  // Always handle preflight here
  if (req.method === "OPTIONS") {
    res.statusCode = 204; // No Content
    res.end();
    return true;          // preflight handled
  }
  return false;           // continue to router
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

export function requireEmployeeRole(req, res, secret, requiredRoles) {
  const user = requireAuth(req, res, secret);
  if (!user) return null;
  const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const role = user.employee_role;
  if (!role || !allowed.includes(role)) {
    sendJSON(res, 403, { error: "forbidden" });
    return null;
  }
  return user;
}
