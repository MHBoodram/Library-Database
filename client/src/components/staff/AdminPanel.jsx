import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "./shared/CommonComponents";
import { ACCOUNT_ROLE_OPTIONS, EMPLOYEE_ROLE_OPTIONS } from "./shared/constants";
import { formatDate } from "../../utils";

const DEFAULT_ADMIN_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  account_type: "employee",
  account_role: "student",
  employee_role: "assistant",
};

export default function AdminPanel({ api }) {
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(DEFAULT_ADMIN_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: null, text: "" });
  const [adminTab, setAdminTab] = useState("overview"); // "overview" | "activity"
  const [activityRows, setActivityRows] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityStartDate, setActivityStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [activityEndDate, setActivityEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activityStaffFilter, setActivityStaffFilter] = useState("all");

  const accountType = form.account_type;

  useEffect(() => {
    if (!api) return;
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const [overviewRes, employeesRes] = await Promise.all([
          api("admin/overview"),
          api("admin/employees"),
        ]);
        if (!alive) return;
        setOverview(overviewRes || {});
        const employeeRows = Array.isArray(employeesRes?.rows)
          ? employeesRes.rows
          : Array.isArray(employeesRes)
            ? employeesRes
            : [];
        setEmployees(employeeRows);
      } catch (err) {
        if (!alive) return;
        const msg = err?.data?.error || err?.message || "Failed to load admin data";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [api, refreshKey]);

  // Load activity when tab is opened (derived from Transactions report)
  useEffect(() => {
    if (!api || adminTab !== "activity") return;
    let alive = true;
    setActivityLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams({ start_date: activityStartDate, end_date: activityEndDate });
        const [transData, accountsData] = await Promise.all([
          api(`reports/transactions?${params.toString()}`),
          api(`admin/accounts/creations?${params.toString()}`),
        ]);
        if (!alive) return;
        
        // Map transactions
        const transRows = Array.isArray(transData?.rows) ? transData.rows : (Array.isArray(transData) ? transData : []);
        const transMapped = transRows.map(r => ({
          ts: r.date,
          staff: [r.employee_first_name, r.employee_last_name].filter(Boolean).join(" ") || "—",
          staff_role: "staff",
          action: (r.type || "").toUpperCase(),
          patron: [r.user_first_name, r.user_last_name].filter(Boolean).join(" ") || `#${r.user_id}`,
          item_title: r.item_title,
          copy_id: r.copy_id,
          loan_id: r.loan_id,
        }));

        // Map account creations
        const acctRows = Array.isArray(accountsData?.rows) ? accountsData.rows : [];
        const acctMapped = acctRows.map(r => ({
          ts: r.created_at,
          staff: "Admin",
          staff_role: r.employee_role || "admin",
          action: "ACCOUNT_CREATED",
          patron: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email,
          item_title: `${r.account_role || 'user'}${r.employee_role ? ` (${r.employee_role})` : ''}`,
          copy_id: null,
          loan_id: null,
          account_id: r.account_id,
        }));

        // Merge and sort by timestamp desc
        const merged = [...transMapped, ...acctMapped].sort((a, b) => new Date(b.ts) - new Date(a.ts));
        setActivityRows(merged);
      } catch (err) {
        if (!alive) return;
        setError(err?.data?.error || err?.message || "Failed to load activity log");
      } finally {
        if (alive) setActivityLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [api, adminTab, activityStartDate, activityEndDate, refreshKey]);

  const activitySummary = useMemo(() => {
    const filtered = activityStaffFilter === "all" 
      ? activityRows 
      : activityRows.filter(r => r.staff_role === activityStaffFilter);
    
    const byStaff = new Map();
    let checkouts = 0, returns = 0, accountsCreated = 0;
    for (const r of filtered) {
      const key = r.staff || '—';
      const acc = byStaff.get(key) || { staff: key, total: 0, checkouts: 0, returns: 0, accounts: 0 };
      acc.total += 1;
      if (r.action === 'CHECKOUT') { acc.checkouts += 1; checkouts += 1; }
      if (r.action === 'RETURN') { acc.returns += 1; returns += 1; }
      if (r.action === 'ACCOUNT_CREATED') { acc.accounts += 1; accountsCreated += 1; }
      byStaff.set(key, acc);
    }
    
    const staffRoles = new Set(activityRows.map(r => r.staff_role).filter(Boolean));
    
    return { 
      total: filtered.length, 
      checkouts, 
      returns, 
      accountsCreated,
      byStaff: Array.from(byStaff.values()).sort((a,b)=>b.total-a.total).slice(0,10),
      filteredRows: filtered,
      availableRoles: Array.from(staffRoles).sort(),
    };
  }, [activityRows, activityStaffFilter]);

  const triggerRefresh = () => setRefreshKey((key) => key + 1);

  const updateForm = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formStatus.type) setFormStatus({ type: null, text: "" });
  };

  const resetForm = () => setForm({ ...DEFAULT_ADMIN_FORM });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!api || submitting) return;
    setSubmitting(true);
    setFormStatus({ type: null, text: "" });
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        account_type: accountType,
        account_role: form.account_role,
      };
      if (accountType === "employee") payload.employee_role = form.employee_role;

      await api("admin/accounts", { method: "POST", body: payload });
      setFormStatus({ type: "success", text: "Account created successfully." });
      resetForm();
      triggerRefresh();
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Failed to create account";
      setFormStatus({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !overview) {
    return <div style={{ padding: "1rem" }}>Loading admin data…</div>;
  }

  if (error && !overview) {
    return <div style={{ padding: "1rem", color: "var(--danger, #b91c1c)" }}>{error}</div>;
  }

  const roleCounts = Array.isArray(overview?.role_counts) ? overview.role_counts : [];
  const recentHires = Array.isArray(overview?.recent_hires) ? overview.recent_hires : [];
  const accountStats = overview?.account_stats || {};
  const fineStats = overview?.fine_stats || {};

  return (
    <section className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[{k:"overview",label:"Overview"},{k:"activity",label:"Activity Log"}].map(t => (
          <button
            key={t.k}
            onClick={() => setAdminTab(t.k)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${adminTab===t.k?"bg-blue-600 text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {t.label}
          </button>
        ))}
        {adminTab === "activity" && (
          <div className="ml-auto flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Staff Role</label>
              <select value={activityStaffFilter} onChange={(e)=>setActivityStaffFilter(e.target.value)} className="rounded-md border-2 bg-white px-3 py-2 text-sm">
                <option value="all">All Roles</option>
                {activitySummary.availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" value={activityStartDate} onChange={(e)=>setActivityStartDate(e.target.value)} className="rounded-md border-2 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" value={activityEndDate} onChange={(e)=>setActivityEndDate(e.target.value)} className="rounded-md border-2 bg-white px-3 py-2 text-sm" />
            </div>
            <button
              onClick={() => setRefreshKey(k=>k+1)}
              className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
              disabled={activityLoading}
            >
              {activityLoading?"Refreshing…":"Refresh"}
            </button>
          </div>
        )}
      </div>

      {adminTab === "activity" ? (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Recent Staff Activity</h3>
          <p className="text-sm text-gray-500 mb-3">Derived from loan transaction history within the selected dates.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Total</div><div className="text-xl font-semibold">{activitySummary.total}</div></div>
            <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Checkouts</div><div className="text-xl font-semibold">{activitySummary.checkouts}</div></div>
            <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Returns</div><div className="text-xl font-semibold">{activitySummary.returns}</div></div>
            <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Accounts Created</div><div className="text-xl font-semibold">{activitySummary.accountsCreated}</div></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Staff</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Patron/Details</th>
                  <th className="px-3 py-2">Item/Type</th>
                  <th className="px-3 py-2">Copy</th>
                  <th className="px-3 py-2">Loan</th>
                </tr>
              </thead>
              <tbody>
                {activitySummary.filteredRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-center text-gray-500" colSpan={8}>
                      {activityLoading ? "Loading…" : "No activity found."}
                    </td>
                  </tr>
                )}
                {activitySummary.filteredRows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{r.ts ? new Date(r.ts).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2">{r.staff}</td>
                    <td className="px-3 py-2 capitalize text-xs">{r.staff_role}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.action==='CHECKOUT'?'bg-blue-100 text-blue-800':
                        r.action==='RETURN'?'bg-amber-100 text-amber-800':
                        'bg-green-100 text-green-800'
                      }`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.patron}</td>
                    <td className="px-3 py-2 max-w-[30ch] truncate" title={r.item_title}>{r.item_title}</td>
                    <td className="px-3 py-2">{r.copy_id ? `#${r.copy_id}` : '—'}</td>
                    <td className="px-3 py-2">{r.loan_id ? `#${r.loan_id}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
      {error && overview && (
        <div style={{ padding: "0.75rem", borderRadius: 6, background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Create Account</h3>
          <p className="text-sm text-gray-500 mb-4">
            Provision a new user or staff account directly from the admin portal.
          </p>

          {formStatus.text && (
            <div
              style={{
                marginBottom: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: 6,
                fontSize: "0.9rem",
                background: formStatus.type === "success" ? "#ecfdf5" : "#fef2f2",
                color: formStatus.type === "success" ? "#065f46" : "#b91c1c",
              }}
            >
              {formStatus.text}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-gray-600">
                First name
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.first_name}
                  onChange={(e) => updateForm("first_name", e.target.value)}
                  required
                />
              </label>
              <label className="text-sm text-gray-600">
                Last name
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.last_name}
                  onChange={(e) => updateForm("last_name", e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="text-sm text-gray-600">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                required
              />
            </label>

            <label className="text-sm text-gray-600">
              Temporary password
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                type="text"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                required
              />
            </label>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Account type</p>
              <div className="flex items-center gap-4 text-sm">
                {[
                  { label: "User", value: "user" },
                  { label: "Employee", value: "employee" },
                ].map((opt) => (
                  <label key={opt.value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="accountType"
                      value={opt.value}
                      checked={accountType === opt.value}
                      onChange={(e) => updateForm("account_type", e.target.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {accountType === "user" && (
              <label className="text-sm text-gray-600">
                Patron role
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.account_role}
                  onChange={(e) => updateForm("account_role", e.target.value)}
                >
                  {ACCOUNT_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {accountType === "employee" && (
              <label className="text-sm text-gray-600">
                Employee role
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.employee_role}
                  onChange={(e) => updateForm("employee_role", e.target.value)}
                >
                  {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create Account"}
            </button>
          </form>
        </div>
        <div className="grid gap-4 md:grid-rows-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="font-semibold mb-2">Manage Accounts</h3>
            <div className="text-sm text-gray-600">
              <label className="block">Open the dedicated account manager to search, edit, or flag any patron or staff record.</label>
              <Link
              to="/manage/accounts"
              style={{
                marginTop: "1rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "#2563eb",
                color: "#fff",
                padding: "0.5rem 0.9rem",
                borderRadius: "999px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Open Account Manager →
            </Link>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Employee Roles</h3>
          <ul className="divide-y divide-gray-100">
            {roleCounts.length === 0 && <li className="py-2 text-sm text-gray-600">No employees found.</li>}
            {roleCounts.map((row) => (
              <li key={row.role} className="py-2 flex items-center justify-between text-sm">
                <span className="capitalize text-gray-700">{row.role}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Accounts"
          value={accountStats.total_accounts ?? 0}
          sub={`Staff: ${accountStats.staff_accounts ?? 0}`}
        />
        <StatCard
          label="Patron Accounts"
          value={accountStats.patron_accounts ?? 0}
          sub="Students + Faculty"
        />
        <StatCard
          label="Open Fines"
          value={fineStats.open_fines ?? 0}
          sub={`$${Number(fineStats.open_fine_amount ?? 0).toFixed(2)}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Recent Hires</h3>
          <ul className="divide-y divide-gray-100">
            {recentHires.length === 0 && <li className="py-2 text-sm text-gray-600">No recent hires.</li>}
            {recentHires.map((emp) => (
              <li key={emp.employee_id} className="py-2">
                <div className="font-medium text-gray-800">
                  {emp.first_name} {emp.last_name}
                </div>
                <div className="text-xs text-gray-500">
                  {emp.role} • {emp.hire_date ? formatDate(emp.hire_date) : "Unknown date"}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Employee Directory</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Hire Date</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-center text-gray-500" colSpan={4}>
                      No employees found.
                    </td>
                  </tr>
                )}
                {employees.map((emp) => (
                  <tr key={emp.employee_id} className="border-t">
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-3 py-2 capitalize text-gray-600">{emp.role}</td>
                    <td className="px-3 py-2">{emp.hire_date ? formatDate(emp.hire_date) : "—"}</td>
                    <td className="px-3 py-2">{emp.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}
    </section>
  );
}
