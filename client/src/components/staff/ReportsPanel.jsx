import React, { useState, useCallback, useEffect } from "react";
import { Th, Td } from "./shared/CommonComponents";
import { formatDate } from "../../utils";

function NewPatronsReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }
  if (!data.length) {
    return <div className="p-8 text-center text-gray-500">No patron signups in the selected window</div>;
  }
  // data: [{ month: 'YYYY-MM', new_patrons: number }, ...]
  const total = data.reduce((sum, r) => sum + Number(r.new_patrons || 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Month</Th>
            <Th>New Patrons</Th>
            <Th>Cumulative</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const monthLabel = new Date(row.month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
            const cumulative = data.slice(0, idx + 1).reduce((s, r) => s + Number(r.new_patrons || 0), 0);
            return (
              <tr key={row.month} className="border-t">
                <Td>{monthLabel}</Td>
                <Td>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${row.new_patrons > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}> 
                    {row.new_patrons} {row.new_patrons === 1 ? 'patron' : 'patrons'}
                  </span>
                </Td>
                <Td className="font-medium">{cumulative}</Td>
              </tr>
            );
          })}
          <tr className="bg-gray-50 border-t">
            <Td className="font-semibold">Total</Td>
            <Td className="font-semibold">{total}</Td>
            <Td className="font-semibold">—</Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function OverdueReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No overdue loans found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Borrower</Th>
            <Th>Item Title</Th>
            <Th>Media Type</Th>
            <Th>Due Date</Th>
            <Th>Days Overdue</Th>
            <Th>Fine</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t">
              <Td>{`${row.first_name} ${row.last_name}`}</Td>
              <Td className="max-w-[30ch] truncate" title={row.title}>{row.title}</Td>
              <Td>{(row.media_type || "book").toUpperCase()}</Td>
              <Td>{formatDate(row.due_date)}</Td>
              <Td>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-medium">
                  {row.days_overdue} days
                </span>
              </Td>
              <Td className="font-medium">
                ${Number(row.dynamic_est_fine || row.est_fine || 0).toFixed(2)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BalancesReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No balances found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Patron</Th>
            <Th>Paid Total</Th>
            <Th>Open Balance</Th>
            <Th>Total</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const paidTotal = Number(row.paid_total || 0);
            const openBalance = Number(row.open_balance_current || row.open_balance || 0);
            const total = paidTotal + openBalance;
            return (
              <tr key={idx} className="border-t">
                <Td>{`${row.first_name} ${row.last_name}`}</Td>
                <Td className="text-green-700 font-medium">${paidTotal.toFixed(2)}</Td>
                <Td className={openBalance > 0 ? "text-red-700 font-medium" : "text-gray-500"}>
                  ${openBalance.toFixed(2)}
                </Td>
                <Td className="font-semibold">${total.toFixed(2)}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopItemsReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No loan activity in selected period</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Rank</Th>
            <Th>Item Title</Th>
            <Th>Media Type</Th>
            <Th>Loans</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t">
              <Td className="font-medium">#{idx + 1}</Td>
              <Td className="max-w-[40ch] truncate" title={row.title}>{row.title}</Td>
              <Td>{(row.media_type || "book").toUpperCase()}</Td>
              <Td>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium">
                  {row.loans_count || row.loans_30d} loans
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionReportTable({data,loading}){
  if (loading) {
    return <div>Loading report...</div>;
  }
  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No loan activity in selected period</div>;
  }
  return (
    <div className="overflow-x-auto">
      <span className="transactions-table-label">Total Transactions: {data.length}</span>
      {loading && <span className="loading">Loading…</span>}
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Patron ID</Th>
            <Th>Patron</Th>
            <Th>Email</Th>
            <Th>Item Title</Th>
            <Th>Copy ID</Th>
            <Th>Loan ID</Th>
            <Th>Transaction</Th>
            <Th>Date</Th>
            <Th>Checked Out By</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <Td>{row.user_id ? `#${row.user_id}` : "—"}</Td>
              <Td>{row.user_first_name && row.user_last_name? `${row.user_first_name} ${row.user_last_name}`: "—"}</Td>
              <Td>{row.user_email || "—"}</Td>
              <Td>{row.item_title || "—"}</Td>
              <Td>{row.copy_id ? `#${row.copy_id}` : "—"}</Td>
              <Td>#{row.loan_id}</Td>
              <Td>
                <span className={`td-action-label td-action-label-${row.type}`}>
                {(row.type || "").toUpperCase()}
                </span>
              </Td>
              <Td>{formatDate(row.date)}</Td>
              <Td>{row.employee_first_name && row.employee_last_name? `${row.employee_first_name} ${row.employee_last_name}`: "—"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPanel({ api }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState("overdue"); // "overdue" | "balances" | "topItems" | "newPatrons" | "transactions"
  const [reportData, setReportData] = useState([]);
  
  // Date ranges for all reports
  const [overdueStartDate, setOverdueStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [overdueEndDate, setOverdueEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [balancesStartDate, setBalancesStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [balancesEndDate, setBalancesEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [topItemsStartDate, setTopItemsStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [topItemsEndDate, setTopItemsEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [newPatronsStartDate, setNewPatronsStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [newPatronsEndDate, setNewPatronsEndDate] = useState(() => new Date().toISOString().slice(0, 10));

    const [transactionsStartDate, setTransactionStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [transactionsEndDate, setTransactionsEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadReport = useCallback(async (reportType) => {
    if (!api) return;
    setLoading(true);
    setError("");
    setReportData([]);

    try {
      let endpoint = "";
      let params = new URLSearchParams();
      
      switch (reportType) {
        case "overdue":
          endpoint = "reports/overdue";
          params.set("start_date", overdueStartDate);
          params.set("end_date", overdueEndDate);
          break;
        case "balances":
          endpoint = "reports/balances";
          params.set("start_date", balancesStartDate);
          params.set("end_date", balancesEndDate);
          break;
        case "topItems":
          endpoint = "reports/top-items";
          params.set("start_date", topItemsStartDate);
          params.set("end_date", topItemsEndDate);
          break;
        case "newPatrons":
          endpoint = "reports/new-patrons-monthly";
          params.set("start_date", newPatronsStartDate);
          params.set("end_date", newPatronsEndDate);
          break;
        case "transactions":
          endpoint = "reports/transactions";
          params.set("start_date", transactionsStartDate);
          params.set("end_date", transactionsEndDate);
          break;
        default:
          throw new Error("Unknown report type");
      }
      const data = await api(`${endpoint}?${params.toString()}`);
      console.log("DATA: ", data);
      setReportData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [api, overdueStartDate, overdueEndDate, balancesStartDate, balancesEndDate, topItemsStartDate, topItemsEndDate, newPatronsStartDate, newPatronsEndDate,transactionsStartDate,transactionsEndDate]);

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport, loadReport]);

  function handleRefresh() {
    loadReport(activeReport);
  }

  function handleExport() {
    // Simple CSV export
    if (reportData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row => 
        headers.map(h => {
          const val = row[h];
          // Escape commas and quotes
          return typeof val === 'string' && (val.includes(',') || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : val ?? "";
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate and view library reports
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => setActiveReport("overdue")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "overdue"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Overdue Loans
              </button>
              <button
                onClick={() => setActiveReport("balances")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "balances"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                User Balances
              </button>
              <button
                onClick={() => setActiveReport("topItems")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "topItems"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Top Items
              </button>
              <button
                onClick={() => setActiveReport("newPatrons")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "newPatrons"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                New Patrons
              </button>
              <button
                onClick={() => setActiveReport("transactions")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "transactions"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Transaction History
              </button>
            </div>

            <div className="flex items-end gap-4">
              {activeReport === "overdue" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={overdueStartDate}
                      onChange={(e) => setOverdueStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={overdueEndDate}
                      onChange={(e) => setOverdueEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "balances" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={balancesStartDate}
                      onChange={(e) => setBalancesStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={balancesEndDate}
                      onChange={(e) => setBalancesEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "topItems" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={topItemsStartDate}
                      onChange={(e) => setTopItemsStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={topItemsEndDate}
                      onChange={(e) => setTopItemsEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "newPatrons" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newPatronsStartDate}
                      onChange={(e) => setNewPatronsStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newPatronsEndDate}
                      onChange={(e) => setNewPatronsEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "transactions" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={transactionsStartDate}
                      onChange={(e) => setTransactionStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={transactionsEndDate}
                      onChange={(e) => setTransactionsEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button
                onClick={handleExport}
                disabled={loading || reportData.length === 0}
                className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            {activeReport === "overdue" && <OverdueReportTable data={reportData} loading={loading} />}
            {activeReport === "balances" && <BalancesReportTable data={reportData} loading={loading} />}
            {activeReport === "topItems" && <TopItemsReportTable data={reportData} loading={loading} />}
            {activeReport === "newPatrons" && <NewPatronsReportTable data={reportData} loading={loading} />}
            {activeReport === "transactions" && <TransactionReportTable data={reportData} loading={loading} />}
          </div>
        </div>
      </div>
    </section>
  );
}
