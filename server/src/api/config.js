import { sendJSON } from "../lib/http.js";

const DEFAULT_TZ = "America/Chicago";

function resolveLibraryTimezone() {
  const tz = (process.env.LIBRARY_TZ || "").trim();
  return tz || DEFAULT_TZ;
}

export const getClientConfig = () => async (_req, res) => {
  return sendJSON(res, 200, {
    library_timezone: resolveLibraryTimezone(),
  });
};
