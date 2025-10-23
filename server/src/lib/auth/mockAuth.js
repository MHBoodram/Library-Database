export const mockAccounts = [
  { account_id: 1, email: "patron@demo.com",  password: "demo123", role: "patron",  user_id: 101 },
  { account_id: 2, email: "staff@demo.com",   password: "demo123", role: "employee", employee_id: 201 },
];

export const sessions = new Map(); // sid -> { id, role, name }

export function findAccount(email, role) {
  const e = String(email || "").toLowerCase().trim();
  return mockAccounts.find(a => a.email === e && a.role === role);
}

export function displayNameFor(acc) {
  return acc.email.split("@")[0];
}
