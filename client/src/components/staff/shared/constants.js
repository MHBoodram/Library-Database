// Shared constants and utilities for Staff Dashboard

export const STATUS_OPTIONS = [
  { value: "outstanding", label: "Outstanding (open/unpaid)" },
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
];

export const EMPLOYEE_ROLE_OPTIONS = ["librarian", "clerk", "assistant", "admin"];
export const ACCOUNT_ROLE_OPTIONS = ["student", "faculty", "staff"];

export async function safeError(res) {
  try {
    const data = await res.json();
    return data?.error || data?.message || "";
  } catch (e) {
    // best-effort: log then return empty message
    if (typeof console !== "undefined" && console.debug) console.debug('safeError parse error', e);
    return "";
  }
}
