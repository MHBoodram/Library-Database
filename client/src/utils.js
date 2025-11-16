import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function formatDate(due) {
  if (!due) return "—";
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return String(due);
  const zonedDate = toZonedTime(d, LIBRARY_TIMEZONE);
  return zonedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: LIBRARY_TIMEZONE,
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const zonedDate = toZonedTime(date, LIBRARY_TIMEZONE);
  return zonedDate.toLocaleString("en-US", {
    timeZone: LIBRARY_TIMEZONE,
  });
}

export function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// Library-specific timezone for consistent display of reservation times
export const LIBRARY_TIMEZONE = "America/Chicago";

// Formats a date/time value in the library's timezone for consistent wall-clock display
export function formatLibraryDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    const zonedDate = toZonedTime(date, LIBRARY_TIMEZONE);
    return zonedDate.toLocaleString("en-US", {
      timeZone: LIBRARY_TIMEZONE,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    // Fallback to local if Intl/timeZone unsupported
    return date.toLocaleString();
  }
}

// Get local time in library timezone (9:30 PM format)
export function getLocalTime(date) {
  if (!date) return "—";
  const zonedDate = toZonedTime(new Date(date), LIBRARY_TIMEZONE);
  return zonedDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: LIBRARY_TIMEZONE,
  });
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
  
  const zonedDate = toZonedTime(date, LIBRARY_TIMEZONE);
  return {
    date,
    year: zonedDate.getFullYear(),
    month: zonedDate.getMonth() + 1,
    day: zonedDate.getDate(),
    hour: zonedDate.getHours(),
    minute: zonedDate.getMinutes(),
    second: zonedDate.getSeconds(),
  };
}

// Convert a naive local datetime string (e.g., from <input type="datetime-local">)
// to a UTC ISO string for transport to the server
export function localDateTimeToUTCISOString(value) {
  if (!value) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

// Convert a library-local datetime string to UTC ISO string
// Uses utcToZonedTime to handle timezone conversion properly
export function libraryDateTimeToUTCISOString(value) {
  if (!value) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return localDateTimeToUTCISOString(value);
  
  const [, year, month, day, hour, minute, second = "00"] = match;
  // Create a date string that represents the library local time
  const localDateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  
  // Convert library local time to UTC
  const utcDate = fromZonedTime(localDateStr, LIBRARY_TIMEZONE);
  return utcDate.toISOString();
}
