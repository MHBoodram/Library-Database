export function formatDate(due) {
  if (!due) return "—";
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return String(due);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// Library-specific timezone for consistent display of reservation times
export const LIBRARY_TIMEZONE = "America/Chicago";
const LIBRARY_TZ_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: LIBRARY_TIMEZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Formats a date/time value in the library's timezone for consistent wall-clock display
export function formatLibraryDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: LIBRARY_TIMEZONE,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    // Fallback to local if Intl/timeZone unsupported
    return date.toLocaleString();
  }
}

// Represent a timestamp as components in the library timezone for comparisons
export function toLibraryTimeParts(value) {
  let date;
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value) &&
    !/[zZ]$/.test(value) &&
    !/([+-]\d{2}:?\d{2})$/.test(value)
  ) {
    date = new Date(libraryDateTimeToUTCISOString(value));
  } else {
    date = value instanceof Date ? value : new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  const parts = LIBRARY_TZ_FORMATTER.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date,
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second || 0),
  };
}

// Convert a naive local datetime string (e.g., from <input type="datetime-local">)
// to a UTC ISO string for transport to the server
export function localDateTimeToUTCISOString(value) {
  if (!value) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

const LIBRARY_TZ_OFFSET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: LIBRARY_TIMEZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function getLibraryOffsetMinutes(date) {
  const parts = LIBRARY_TZ_OFFSET_FORMATTER.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second || 0)
  );
  return (asUTC - date.getTime()) / 60000;
}

export function libraryDateTimeToUTCISOString(value) {
  if (!value) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return localDateTimeToUTCISOString(value);
  const [, year, month, day, hour, minute, second = "00"] = match;
  const base = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
  const offsetMinutes = getLibraryOffsetMinutes(new Date(base));
  const utcMillis = base - offsetMinutes * 60 * 1000;
  return new Date(utcMillis).toISOString();
}
