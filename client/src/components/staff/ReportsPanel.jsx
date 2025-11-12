import React, { useState, useCallback, useEffect, useMemo } from "react";
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
            <Th>Patron ID</Th>
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
              <Td>{(row.patron_id ?? row.user_id) != null ? String(row.patron_id ?? row.user_id) : '—'}</Td>
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
  // client-side sorting
  const [sortKey, setSortKey] = React.useState('event_timestamp');
  const [sortDir, setSortDir] = React.useState('desc');
  const sorted = React.useMemo(() => {
    const arr = [...data].map((r, i) => ({...r, __i:i}));
    const cmp = (a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'event_timestamp') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else if (typeof av === 'string' && typeof bv === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return -1*dir; if (av > bv) return 1*dir; return a.__i - b.__i; // stable
    };
    arr.sort(cmp);
    return arr;
  }, [data, sortKey, sortDir]);
  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortableTh = ({label, keyName}) => (
    <Th>
      <button onClick={() => onSort(keyName)} className="inline-flex items-center gap-1">
        {label}
        {sortKey === keyName ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </button>
    </Th>
  );
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between px-2 py-1 text-sm text-gray-600">
        <span className="transactions-table-label">Total Events: {data.length}</span>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <SortableTh label="Patron ID" keyName="user_id" />
            <SortableTh label="Patron" keyName="user_last_name" />
            <Th>Email</Th>
            <SortableTh label="Item Title" keyName="item_title" />
            <SortableTh label="Copy ID" keyName="copy_id" />
            <SortableTh label="Loan ID" keyName="loan_id" />
            <SortableTh label="Event Type" keyName="event_type" />
            <SortableTh label="Event Timestamp" keyName="event_timestamp" />
            <SortableTh label="Staff User" keyName="employee_last_name" />
            <SortableTh label="Current Status" keyName="current_status" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr key={row.transaction_id || idx} className="border-t">
              <Td>{row.user_id ? `#${row.user_id}` : '—'}</Td>
              <Td>{row.user_first_name || row.user_last_name ? `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim() : '—'}</Td>
              <Td>{row.user_email || '—'}</Td>
              <Td className="max-w-[30ch] truncate" title={row.item_title || ''}>{row.item_title || '—'}</Td>
              <Td>{row.copy_id ? `#${row.copy_id}` : '—'}</Td>
              <Td>{row.loan_id ? `#${row.loan_id}` : '—'}</Td>
              <Td>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${row.event_type==='approved' ? 'bg-green-100 text-green-800' : row.event_type==='requested' ? 'bg-blue-100 text-blue-800' : row.event_type==='rejected' ? 'bg-red-100 text-red-800' : row.event_type==='returned' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-600'}`}>
                  {String(row.event_type || row.raw_type || '').toUpperCase()}
                </span>
              </Td>
              <Td>{row.event_timestamp ? new Date(row.event_timestamp).toLocaleString() : '—'}</Td>
              <Td>{row.employee_first_name || row.employee_last_name ? `${row.employee_first_name || ''} ${row.employee_last_name || ''}`.trim() : '—'}</Td>
              <Td>{row.current_status || '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionsFilters({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  data,
  onRefresh,
  eventTypes,
  setEventTypes,
  statuses,
  setStatuses,
  staff,
  setStaff,
  search,
  setSearch,
}) {
  const allTypes = ['requested','approved','rejected','returned'];
  const allStatuses = ['Pending','Approved & Active','Rejected','Returned'];
  const staffOptions = React.useMemo(() => {
    const byId = new Map();
    (data || []).forEach(r => {
      if (r.employee_id) {
        const name = `${r.employee_first_name || ''} ${r.employee_last_name || ''}`.trim() || `#${r.employee_id}`;
        byId.set(r.employee_id, name);
      }
    });
    return Array.from(byId.entries());
  }, [data]);

  const toggleIn = (list, value, setter) => {
    const has = list.includes(value);
    setter(has ? list.filter(v => v !== value) : [...list, value]);
  };

  const onGenerate = () => onRefresh && onRefresh();
  const onReset = () => {
    const d = new Date();
    const sd = new Date(); sd.setFullYear(sd.getFullYear()-1);
    setStartDate(sd.toISOString().slice(0,10));
    setEndDate(d.toISOString().slice(0,10));
    setEventTypes(allTypes);
    setStatuses(allStatuses);
    setStaff('');
    setSearch('');
    onRefresh && onRefresh();
  };
  const onClear = () => {
    setStartDate('');
    setEndDate('');
    setEventTypes(allTypes);
    setStatuses(allStatuses);
    setStaff('');
    setSearch('');
    onRefresh && onRefresh();
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm" />
      </div>
      <div className="flex flex-col">
        <span className="block text-xs font-medium text-gray-600 mb-1">Event Type</span>
        <div className="flex flex-wrap gap-2">
          {allTypes.map(t => (
            <label key={t} className="inline-flex items-center gap-1 text-xs">
              <input type="checkbox" checked={eventTypes.includes(t)} onChange={()=>toggleIn(eventTypes, t, setEventTypes)} /> {t}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="block text-xs font-medium text-gray-600 mb-1">Current Status</span>
        <div className="flex flex-wrap gap-2">
          {['Pending','Approved & Active','Rejected','Returned'].map(s => (
            <label key={s} className="inline-flex items-center gap-1 text-xs">
              <input type="checkbox" checked={statuses.includes(s)} onChange={()=>toggleIn(statuses, s, setStatuses)} /> {s}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Staff User</label>
        <select value={staff} onChange={e=>setStaff(e.target.value)} className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm">
          <option value="">All</option>
          {staffOptions.map(([id,name]) => (<option key={id} value={id}>{name}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
        <input type="text" placeholder="Patron, item, Loan/Copy ID" value={search} onChange={e=>setSearch(e.target.value)} className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm" />
      </div>
      <div className="pt-1 space-x-2">
        <button onClick={onGenerate} className="px-3 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-800">Generate Report</button>
        <button onClick={onReset} className="px-3 py-2 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300">Reset</button>
        <button onClick={onClear} className="px-3 py-2 rounded-md bg-white border text-sm font-medium hover:bg-gray-50">Clear Filters</button>
      </div>
    </div>
  );
}

export default function ReportsPanel({ api }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState("overdue"); // "overdue" | "fines" | "balances" | "topItems" | "newPatrons" | "transactions"
  const [reportData, setReportData] = useState([]);
  
  // Date ranges for all reports
  const [overdueStartDate, setOverdueStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [overdueEndDate, setOverdueEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [overdueBorrower, setOverdueBorrower] = useState("");
  const [overduePatronId, setOverduePatronId] = useState("");
  const [overdueMinDays, setOverdueMinDays] = useState(1);
  const [overdueMediaType, setOverdueMediaType] = useState("all");
  const [overdueGraceMode, setOverdueGraceMode] = useState('all'); // beyond | within | all
  const [overdueSortMode, setOverdueSortMode] = useState('most'); // most | least

  // Fines report state
  const [finesStartDate, setFinesStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,10);
  });
  const [finesEndDate, setFinesEndDate] = useState(() => new Date().toISOString().slice(0,10));
  const [finesStatus, setFinesStatus] = useState('all'); // active | closed | all
  const [finesAmountMin, setFinesAmountMin] = useState('');
  const [finesAmountMax, setFinesAmountMax] = useState('');
  const [finesBorrower, setFinesBorrower] = useState('');
  const [finesPatronId, setFinesPatronId] = useState('');
  const [finesItemTitle, setFinesItemTitle] = useState('');
  const [finesMediaType, setFinesMediaType] = useState('all');
  const [finesReason, setFinesReason] = useState('all');
  const [finesAging, setFinesAging] = useState('all'); // all | 0-7 | 8-30 | 31-60 | 61-90 | 90+
  const [finesOnlyActive, setFinesOnlyActive] = useState(false);
  const [finesIncludeWaived, setFinesIncludeWaived] = useState(true);
  
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
  // Transactions filters
  const [txEventTypes, setTxEventTypes] = useState(['requested','approved','rejected','returned']);
  const [txStatuses, setTxStatuses] = useState(['Pending','Approved & Active','Rejected','Returned']);
  const [txStaff, setTxStaff] = useState('');
  const [txSearch, setTxSearch] = useState('');

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
          if (overdueBorrower && overdueBorrower.trim()) {
            params.set("borrower", overdueBorrower.trim());
          }
          // Patron ID partial match handled client-side; avoid over-filtering on server
          if (overdueGraceMode) params.set('grace', overdueGraceMode);
          if (overdueSortMode) params.set('sort', overdueSortMode);
          break;
        case "fines":
          // staff fines endpoint; request a large page and all statuses so we can filter client-side
          endpoint = "staff/fines";
          params.set("status", "all");
          params.set("pageSize", "1000");
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
          if (Array.isArray(txEventTypes) && txEventTypes.length) params.set('types', txEventTypes.join(','));
          if (Array.isArray(txStatuses) && txStatuses.length) params.set('statuses', txStatuses.join(','));
          if (txStaff) params.set('staff', String(txStaff));
          if ((txSearch||'').trim()) params.set('q', (txSearch||'').trim());
          break;
        default:
          throw new Error("Unknown report type");
      }
      const data = await api(`${endpoint}?${params.toString()}`);
      console.log("DATA: ", data);
      // Some endpoints return arrays, staff endpoints return { rows }
      const rows = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
      setReportData(rows);
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [api, overdueStartDate, overdueEndDate, overdueBorrower, overdueGraceMode, overdueSortMode, balancesStartDate, balancesEndDate, topItemsStartDate, topItemsEndDate, newPatronsStartDate, newPatronsEndDate,transactionsStartDate,transactionsEndDate, txEventTypes, txStatuses, txStaff, txSearch]);

  // Derived media types from the currently loaded overdue dataset
  const mediaTypeOptions = useMemo(() => {
    const types = new Set((reportData || []).map(r => (r.media_type || 'book').toString().toLowerCase()));
    return ['all', ...Array.from(types).sort()];
  }, [reportData]);

  // Fines: derived options
  const finesMediaOptions = useMemo(() => {
    const types = new Set((reportData || []).map(r => (r.media_type || 'book').toString().toLowerCase()));
    return ['all', ...Array.from(types).sort()];
  }, [reportData]);
  const finesReasonOptions = useMemo(() => {
    const reasons = new Set((reportData || []).map(r => (r.reason || '').toString().toLowerCase()).filter(Boolean));
    return ['all', ...Array.from(reasons).sort()];
  }, [reportData]);

  // Client-side filtering for min days, media type and partial patron id
  const overdueFilteredRows = useMemo(() => {
    if (activeReport !== 'overdue') return reportData || [];
    const pidFilter = overduePatronId.trim();
    const pidActive = pidFilter.length > 0;
    const pidLower = pidFilter.toLowerCase();
    const mt = (overdueMediaType || 'all').toLowerCase();
    const minDays = Number.isFinite(Number(overdueMinDays)) ? Number(overdueMinDays) : 0;
    return (reportData || []).filter(r => {
      const daysOk = Number(r.days_overdue || 0) >= minDays;
      const mtOk = mt === 'all' || (String(r.media_type || 'book').toLowerCase() === mt);
      const pidOk = !pidActive || String(r.patron_id ?? r.user_id ?? '').toLowerCase().includes(pidLower);
      return daysOk && mtOk && pidOk;
    });
  }, [activeReport, reportData, overdueMinDays, overdueMediaType, overduePatronId]);

  // KPI calculations for overdue
  const overdueKPIs = useMemo(() => {
    if (activeReport !== 'overdue') return null;
    const rows = overdueFilteredRows;
    const total = rows.length;
    const uniqueBorrowers = new Set(rows.map(r => String(r.patron_id ?? r.user_id))).size;
    const days = rows.map(r => Number(r.days_overdue || 0)).sort((a,b)=>a-b);
    const avg = total ? (days.reduce((s,x)=>s+x,0)/total) : 0;
    const med = total ? (days[Math.floor((total-1)/2)] + days[Math.ceil((total-1)/2)]) / 2 : 0;
    const max = total ? days[total-1] : 0;
    return { total, uniqueBorrowers, avg: Number(avg.toFixed(1)), med, max };
  }, [activeReport, overdueFilteredRows]);

  // Transactions filtering and KPIs
  const transactionsFilteredRows = useMemo(() => {
    if (activeReport !== 'transactions') return reportData || [];
    const types = new Set(txEventTypes);
    const statuses = new Set(txStatuses);
    const staffId = txStaff ? String(txStaff) : '';
    const q = (txSearch || '').trim().toLowerCase();
    return (reportData || []).filter(r => {
      const typeOk = !r.event_type || types.has(String(r.event_type));
      const statusOk = !r.current_status || statuses.has(String(r.current_status));
      const staffOk = !staffId || String(r.employee_id||'') === staffId;
      if (!q) return typeOk && statusOk && staffOk;
      const patron = `${r.user_first_name||''} ${r.user_last_name||''}`.toLowerCase();
      const email = String(r.user_email||'').toLowerCase();
      const title = String(r.item_title||'').toLowerCase();
      const loan = String(r.loan_id||'');
      const copy = String(r.copy_id||'');
      const hit = patron.includes(q) || email.includes(q) || title.includes(q) || loan.includes(q) || copy.includes(q);
      return typeOk && statusOk && staffOk && hit;
    });
  }, [activeReport, reportData, txEventTypes, txStatuses, txStaff, txSearch]);

  const transactionsKPIs = useMemo(() => {
    if (activeReport !== 'transactions') return null;
    const rows = transactionsFilteredRows;
    const requests = rows.filter(r => r.event_type === 'requested');
    const byLoan = new Map();
    rows.forEach(r => {
      if (!r.loan_id) return;
      const list = byLoan.get(r.loan_id) || [];
      list.push(r);
      byLoan.set(r.loan_id, list);
    });
    let approvals = 0, rejections = 0, pendingQueue = 0;
    const tta = []; // ms to approval
    const ttr = []; // ms to return
    byLoan.forEach(events => {
      events.sort((a,b)=>new Date(a.event_timestamp)-new Date(b.event_timestamp));
      const firstReq = events.find(e=>e.event_type==='requested');
      const firstAppr = events.find(e=>e.event_type==='approved');
      const firstRej = events.find(e=>e.event_type==='rejected');
      const firstRet = events.find(e=>e.event_type==='returned');
      if (firstReq && firstAppr) {
        approvals += 1;
        tta.push(new Date(firstAppr.event_timestamp) - new Date(firstReq.event_timestamp));
      } else if (firstReq && firstRej) {
        rejections += 1;
      }
      if (firstAppr && firstRet) {
        ttr.push(new Date(firstRet.event_timestamp) - new Date(firstAppr.event_timestamp));
      }
      const latest = events[events.length-1];
      if (latest && latest.event_type === 'requested' && !firstAppr && !firstRej) pendingQueue += 1;
    });
    const denom = approvals + rejections;
    const approvalRate = denom ? (approvals/denom) : 0;
    const avg = (arr)=> arr.length ? (arr.reduce((s,x)=>s+x,0)/arr.length) : 0;
    const median = (arr)=>{
      if (!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const m=(a.length-1)/2; return (a[Math.floor(m)]+a[Math.ceil(m)])/2;
    };
    const p90 = (arr)=>{
      if (!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const idx=Math.floor(0.9*(a.length-1)); return a[idx];
    };
    const msToHours = (ms)=> Math.round((ms/36e5)*10)/10; // one decimal
    return {
      requests: requests.length,
      approvals,
      rejections,
      approvalRate,
      avgTimeToApprovalH: msToHours(avg(tta)),
      medTimeToApprovalH: msToHours(median(tta)),
      p90TimeToApprovalH: msToHours(p90(tta)),
      avgTimeToReturnH: msToHours(avg(ttr)),
      pendingQueue,
    };
  }, [activeReport, transactionsFilteredRows]);

  // Fines filtering and KPIs
  const finesFilteredRows = useMemo(() => {
    if (activeReport !== 'fines') return reportData || [];
    const sDate = finesStartDate ? new Date(finesStartDate) : null;
    const eDate = finesEndDate ? new Date(finesEndDate) : null;
    const amtMin = finesAmountMin !== '' ? Number(finesAmountMin) : null;
    const amtMax = finesAmountMax !== '' ? Number(finesAmountMax) : null;
    const statusSel = finesStatus; // 'active' | 'closed' | 'all'
    const mt = (finesMediaType || 'all').toLowerCase();
    const reason = (finesReason || 'all').toLowerCase();
    const pidFilter = (finesPatronId || '').trim().toLowerCase();
    const borrowerFilter = (finesBorrower || '').trim().toLowerCase();
    const titleFilter = (finesItemTitle || '').trim().toLowerCase();

    const agingMatch = (days) => {
      const d = Number(days || 0);
      switch (finesAging) {
        case '0-7': return d >= 0 && d <= 7;
        case '8-30': return d >= 8 && d <= 30;
        case '31-60': return d >= 31 && d <= 60;
        case '61-90': return d >= 61 && d <= 90;
        case '90+': return d >= 91;
        default: return true;
      }
    };

    const isActive = (st) => !['paid','waived'].includes(String(st||'').toLowerCase());

    return (reportData || []).filter(r => {
      // dates
      if (sDate && (!r.assessed_at || new Date(r.assessed_at) < sDate)) return false;
      if (eDate && (!r.assessed_at || new Date(r.assessed_at) > eDate)) return false;
      // status
      if (statusSel === 'active' && !isActive(r.status)) return false;
      if (statusSel === 'closed' && isActive(r.status)) return false;
      if (finesOnlyActive && !isActive(r.status)) return false;
      if (!finesIncludeWaived && String(r.status||'').toLowerCase() === 'waived') return false;
      // amounts
      const amt = Number(r.amount_assessed || 0);
      if (amtMin != null && amtMin !== '' && amt < amtMin) return false;
      if (amtMax != null && amtMax !== '' && amt > amtMax) return false;
      // borrower
      const borrowerName = `${(r.first_name||'').toLowerCase()} ${(r.last_name||'').toLowerCase()}`.trim();
      if (borrowerFilter && !borrowerName.includes(borrowerFilter)) return false;
      // patron id
      const pid = String(r.patron_id ?? r.user_id ?? '').toLowerCase();
      if (pidFilter && !pid.includes(pidFilter)) return false;
      // title
      if (titleFilter && !String(r.title||'').toLowerCase().includes(titleFilter)) return false;
      // media type
      if (mt !== 'all' && String(r.media_type||'book').toLowerCase() !== mt) return false;
      // reason
      if (reason !== 'all' && String(r.reason||'').toLowerCase() !== reason) return false;
      // aging
      if (!agingMatch(r.days_overdue)) return false;
      return true;
    });
  }, [activeReport, reportData, finesStartDate, finesEndDate, finesStatus, finesOnlyActive, finesIncludeWaived, finesAmountMin, finesAmountMax, finesBorrower, finesPatronId, finesItemTitle, finesMediaType, finesReason, finesAging]);

  const finesKPIs = useMemo(() => {
    if (activeReport !== 'fines') return null;
    const rows = finesFilteredRows;
    const total = rows.length;
    const uniqueBorrowers = new Set(rows.map(r => String(r.patron_id ?? r.user_id))).size;
    const amounts = rows.map(r => Number(r.amount_assessed || 0)).sort((a,b)=>a-b);
    const sum = amounts.reduce((s,x)=>s+x,0);
    const paid = rows.reduce((s,r)=> s + Number(r.amount_paid || 0), 0);
    const waived = rows.filter(r => String(r.status||'').toLowerCase()==='waived').reduce((s,r)=> s + Number(r.amount_assessed||0), 0);
    const outstanding = rows.reduce((s,r)=> {
      const st = String(r.status||'').toLowerCase();
      const isAct = !['paid','waived'].includes(st);
      const due = Math.max(0, Number(r.amount_assessed||0) - Number(r.amount_paid||0));
      return s + (isAct ? due : 0);
    }, 0);
    const avg = total ? sum/total : 0;
    const med = total ? (amounts[Math.floor((total-1)/2)] + amounts[Math.ceil((total-1)/2)]) / 2 : 0;
    const p95 = total ? amounts[Math.min(total-1, Math.ceil(0.95*total)-1)] : 0;
    const max = total ? amounts[total-1] : 0;
    const agingBuckets = { '0-7':0, '8-30':0, '31-60':0, '61-90':0, '90+':0 };
    rows.forEach(r=>{
      const d = Number(r.days_overdue||0);
      if (d<=7) agingBuckets['0-7']++; else if (d<=30) agingBuckets['8-30']++; else if (d<=60) agingBuckets['31-60']++; else if (d<=90) agingBuckets['61-90']++; else agingBuckets['90+']++;
    });
    // top borrowers by outstanding
    const byBorrower = new Map();
    rows.forEach(r=>{
      const id = String(r.patron_id ?? r.user_id);
      const name = `${r.first_name||''} ${r.last_name||''}`.trim() || `#${id}`;
      const st = String(r.status||'').toLowerCase();
      const isAct = !['paid','waived'].includes(st);
      const due = Math.max(0, Number(r.amount_assessed||0) - Number(r.amount_paid||0));
      const rec = byBorrower.get(id) || { id, name, outstanding: 0 };
      rec.outstanding += isAct ? due : 0; byBorrower.set(id, rec);
    });
    const topBorrowers = Array.from(byBorrower.values()).sort((a,b)=> b.outstanding - a.outstanding).slice(0,5);
    return { total, uniqueBorrowers, sum, outstanding, paid, waived, avg: Number(avg.toFixed(2)), med, p95, max, agingBuckets, topBorrowers };
  }, [activeReport, finesFilteredRows]);

  function onFinesGenerate() {
    // Just validate dates and reload; data filters apply client-side
    if (finesStartDate && finesEndDate && new Date(finesEndDate) < new Date(finesStartDate)) {
      setError('End date cannot be before start date'); return;
    }
    loadReport('fines');
  }
  function onFinesReset() {
    const d = new Date(); const lastMonth = new Date(d.getFullYear(), d.getMonth()-1, d.getDate());
    setFinesStartDate(lastMonth.toISOString().slice(0,10));
    setFinesEndDate(new Date().toISOString().slice(0,10));
    setFinesStatus('all'); setFinesAmountMin(''); setFinesAmountMax(''); setFinesBorrower(''); setFinesPatronId(''); setFinesItemTitle(''); setFinesMediaType('all'); setFinesReason('all'); setFinesAging('all'); setFinesOnlyActive(false); setFinesIncludeWaived(true);
    loadReport('fines');
  }
  function onFinesClear() {
    setFinesStartDate(''); setFinesEndDate(''); setFinesStatus('all'); setFinesAmountMin(''); setFinesAmountMax(''); setFinesBorrower(''); setFinesPatronId(''); setFinesItemTitle(''); setFinesMediaType('all'); setFinesReason('all'); setFinesAging('all'); setFinesOnlyActive(false); setFinesIncludeWaived(true);
    loadReport('fines');
  }

  // Removed trend and top-borrowers computations to simplify and avoid unused variables

  // Actions
  function validateOverdueDates() {
    if (!overdueStartDate || !overdueEndDate) return true; // allow empty for defaults
    return new Date(overdueEndDate) >= new Date(overdueStartDate);
  }

  function onGenerate() {
    if (!validateOverdueDates()) { setError('End date cannot be before start date'); return; }
    loadReport('overdue');
  }

  function onReset() {
    const d = new Date(); const lastMonth = new Date(d.getFullYear(), d.getMonth()-1, d.getDate());
    setOverdueStartDate(lastMonth.toISOString().slice(0,10));
    setOverdueEndDate(new Date().toISOString().slice(0,10));
    setOverdueBorrower("");
    setOverduePatronId("");
    setOverdueMinDays(1);
    setOverdueMediaType('all');
  // no-op: borrowers view removed
    loadReport('overdue');
  }

  function onClear() {
    setOverdueStartDate("");
    setOverdueEndDate("");
    setOverdueBorrower("");
    setOverduePatronId("");
    setOverdueMinDays(0);
    setOverdueMediaType('all');
  // no-op: borrowers view removed
    loadReport('overdue');
  }

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport, loadReport]);

  // handleRefresh removed (unused)

  function handleExport() {
    const exportRows = activeReport === 'overdue' ? overdueFilteredRows : (activeReport === 'fines' ? finesFilteredRows : (activeReport === 'transactions' ? transactionsFilteredRows : reportData));
    if (!exportRows || exportRows.length === 0) { alert("No data to export"); return; }
    const headers = Object.keys(exportRows[0]);
    const csvContent = [
      headers.join(","),
      ...exportRows.map(row => 
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
          {/* Panel buttons row */}
          <div className="flex flex-wrap gap-2">
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
              onClick={() => setActiveReport("fines")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeReport === "fines"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Fines
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
            
            {/* Export button aligned to the right */}
            <div className="ml-auto">
              <button
                onClick={handleExport}
                disabled={
                  loading || (
                    activeReport === 'overdue' ? overdueFilteredRows.length === 0 :
                    activeReport === 'fines' ? finesFilteredRows.length === 0 :
                    activeReport === 'transactions' ? transactionsFilteredRows.length === 0 :
                    reportData.length === 0
                  )
                }
                className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters section - now below the panels */}
          <div className="space-y-3">
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
            {activeReport === "fines" && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={finesStartDate}
                    onChange={(e) => setFinesStartDate(e.target.value)}
                    className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={finesEndDate}
                    onChange={(e) => setFinesEndDate(e.target.value)}
                    className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                  />
                </div>
              </div>
            )}
            {activeReport === "transactions" && (
              <div className="flex justify-end">
                <div className="w-full md:w-72">
                  <div className="rounded-md border bg-white p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Event Type</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['requested','approved','rejected','returned'].map(t => (
                          <label key={t} className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={txEventTypes.includes(t)} 
                              onChange={()=>setTxEventTypes(prev => prev.includes(t)? prev.filter(x=>x!==t) : [...prev, t])}
                              className="w-4 h-4"
                            /> 
                            <span className="capitalize">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Current Status</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Pending','Approved & Active','Rejected','Returned'].map(s => (
                          <label key={s} className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={txStatuses.includes(s)} 
                              onChange={()=>setTxStatuses(prev => prev.includes(s)? prev.filter(x=>x!==s) : [...prev, s])}
                              className="w-4 h-4"
                            /> 
                            <span>{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Staff User</label>
                      <select value={txStaff} onChange={e=>setTxStaff(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm">
                        <option value="">All</option>
                        {Array.from(new Map((reportData||[]).filter(r=>r.employee_id).map(r=>[r.employee_id, `${r.employee_first_name||''} ${r.employee_last_name||''}`.trim()||`#${r.employee_id}`])).entries()).map(([id,name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                      <input type="text" placeholder="Patron, item, Loan/Copy ID" value={txSearch} onChange={e=>setTxSearch(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm" />
                    </div>
                    <div className="pt-1 space-y-2">
                      <button onClick={()=>loadReport('transactions')} disabled={loading} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50">{loading ? 'Loading...' : 'Generate Report'}</button>
                      <div className="flex gap-2">
                        <button onClick={()=>{const d=new Date();const sd=new Date();sd.setFullYear(sd.getFullYear()-1);setTransactionStartDate(sd.toISOString().slice(0,10));setTransactionsEndDate(d.toISOString().slice(0,10));setTxEventTypes(['requested','approved','rejected','returned']);setTxStatuses(['Pending','Approved & Active','Rejected','Returned']);setTxStaff('');setTxSearch('');loadReport('transactions');}} disabled={loading} className="flex-1 px-3 py-2 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 disabled:opacity-50">Reset</button>
                        <button onClick={()=>{setTransactionStartDate('');setTransactionsEndDate('');setTxEventTypes(['requested','approved','rejected','returned']);setTxStatuses(['Pending','Approved & Active','Rejected','Returned']);setTxStaff('');setTxSearch('');loadReport('transactions');}} disabled={loading} className="flex-1 px-3 py-2 rounded-md bg-white border text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Clear</button>
                      </div>
                    </div>
                  </div>
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
          </div>

          {/* Right-aligned filter block shown under the panel bar for Overdue Loans and Fines (dates moved to toolbar; export moved to toolbar) */}
          {activeReport === "overdue" && (
            <div className="flex justify-end">
              <div className="w-full md:w-72">
                <div className="rounded-md border bg-white p-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Borrower</label>
                    <input type="text" placeholder="Search borrower name" value={overdueBorrower} onChange={(e)=>setOverdueBorrower(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Patron ID</label>
                    <input type="text" placeholder="partial match" value={overduePatronId} onChange={(e)=>setOverduePatronId(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min Days Overdue</label>
                    <input type="number" min="0" value={overdueMinDays} onChange={(e)=>setOverdueMinDays(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Media Type</label>
                    <select value={overdueMediaType} onChange={(e)=>setOverdueMediaType(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm">
                      {mediaTypeOptions.map(opt => (<option key={opt} value={opt}>{opt === 'all' ? 'All' : opt.toUpperCase()}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Grace Window</label>
                    <select value={overdueGraceMode} onChange={(e)=>setOverdueGraceMode(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm">
                      <option value="beyond">Beyond grace (overdue)</option>
                      <option value="within">Within grace</option>
                      <option value="all">All past due</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
                    <select value={overdueSortMode} onChange={(e)=>setOverdueSortMode(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm">
                      <option value="most">Most overdue → least</option>
                      <option value="least">Least overdue → most</option>
                    </select>
                  </div>
                  <div className="pt-1 space-y-2">
                    <button onClick={onGenerate} disabled={loading} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50">{loading ? 'Loading...' : 'Generate Report'}</button>
                    <div className="flex gap-2">
                      <button onClick={onReset} disabled={loading} className="flex-1 px-3 py-2 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 disabled:opacity-50">Reset</button>
                      <button onClick={onClear} disabled={loading} className="flex-1 px-3 py-2 rounded-md bg-white border text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Clear</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === "fines" && (
            <div className="flex justify-end">
              <div className="w-full md:w-72">
                <div className="rounded-md border bg-white p-3 space-y-3">
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select value={finesStatus} onChange={(e)=>setFinesStatus(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm">
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount Min</label>
                      <input type="number" value={finesAmountMin} onChange={(e)=>setFinesAmountMin(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount Max</label>
                      <input type="number" value={finesAmountMax} onChange={(e)=>setFinesAmountMax(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Borrower</label>
                    <input type="text" value={finesBorrower} onChange={(e)=>setFinesBorrower(e.target.value)} placeholder="partial match" className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Patron ID</label>
                    <input type="text" value={finesPatronId} onChange={(e)=>setFinesPatronId(e.target.value)} placeholder="partial match" className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Item Title</label>
                    <input type="text" value={finesItemTitle} onChange={(e)=>setFinesItemTitle(e.target.value)} placeholder="partial match" className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Media Type</label>
                    <select value={finesMediaType} onChange={(e)=>setFinesMediaType(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm">
                      {finesMediaOptions.map(opt => (<option key={opt} value={opt}>{opt==='all'?'All':opt.toUpperCase()}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                    <select value={finesReason} onChange={(e)=>setFinesReason(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm">
                      {finesReasonOptions.map(opt => (<option key={opt} value={opt}>{opt==='all'?'All':opt}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aging</label>
                    <select value={finesAging} onChange={(e)=>setFinesAging(e.target.value)} className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm">
                      <option value="all">All</option>
                      <option value="0-7">0–7 days</option>
                      <option value="8-30">8–30 days</option>
                      <option value="31-60">31–60 days</option>
                      <option value="61-90">61–90 days</option>
                      <option value="90+">90+ days</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={finesOnlyActive} onChange={(e)=>setFinesOnlyActive(e.target.checked)} /> Only active fines</label>
                    <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={finesIncludeWaived} onChange={(e)=>setFinesIncludeWaived(e.target.checked)} /> Include waived</label>
                  </div>
                  <div className="pt-1 space-y-2">
                    <button onClick={onFinesGenerate} disabled={loading} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50">{loading ? 'Loading...' : 'Generate Report'}</button>
                    <div className="flex gap-2">
                      <button onClick={onFinesReset} disabled={loading} className="flex-1 px-3 py-2 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 disabled:opacity-50">Reset</button>
                      <button onClick={onFinesClear} disabled={loading} className="flex-1 px-3 py-2 rounded-md bg-white border text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Clear</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === 'overdue' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Total Overdue</div><div className="text-xl font-semibold">{overdueKPIs?.total || 0}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Distinct Borrowers</div><div className="text-xl font-semibold">{overdueKPIs?.uniqueBorrowers || 0}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Avg Days</div><div className="text-xl font-semibold">{overdueKPIs?.avg ?? 0}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Median / Max</div><div className="text-xl font-semibold">{overdueKPIs?.med ?? 0} / {overdueKPIs?.max ?? 0}</div></div>
              </div>
              <div className="text-sm text-gray-700">
                {overdueFilteredRows.length === 0 ? (
                  <span>No overdue items matched the selected parameters.</span>
                ) : (
                  <span>
                    {`There are ${overdueKPIs?.total} overdue items across ${overdueKPIs?.uniqueBorrowers} patrons. Average delay is ${overdueKPIs?.avg} days with a median of ${overdueKPIs?.med} and maximum of ${overdueKPIs?.max}.`}
                  </span>
                )}
              </div>
              {/* Trend chart removed per request */}
              {/* Top borrowers chart removed per request */}
            </div>
          )}
          {activeReport === 'fines' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Total Fines</div><div className="text-xl font-semibold">{finesKPIs?.total || 0}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Distinct Borrowers</div><div className="text-xl font-semibold">{finesKPIs?.uniqueBorrowers || 0}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Assessed Total</div><div className="text-xl font-semibold">${(finesKPIs?.sum || 0).toFixed(2)}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Outstanding</div><div className="text-xl font-semibold">${(finesKPIs?.outstanding || 0).toFixed(2)}</div></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Paid</div><div className="text-xl font-semibold">${(finesKPIs?.paid || 0).toFixed(2)}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Waived</div><div className="text-xl font-semibold">${(finesKPIs?.waived || 0).toFixed(2)}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">Avg / Median</div><div className="text-xl font-semibold">${(finesKPIs?.avg || 0).toFixed(2)} / ${(finesKPIs?.med || 0).toFixed(2)}</div></div>
                <div className="rounded-md border bg-white p-3 text-sm"><div className="text-gray-500">P95 / Max</div><div className="text-xl font-semibold">${(finesKPIs?.p95 || 0).toFixed(2)} / ${(finesKPIs?.max || 0).toFixed(2)}</div></div>
              </div>
              <div className="text-sm text-gray-700">
                {finesFilteredRows.length === 0 ? (
                  <span>No fines matched the selected parameters.</span>
                ) : (
                  <span>
                    {`Report shows ${finesKPIs?.total} fines for ${finesKPIs?.uniqueBorrowers} patrons. Outstanding is $${(finesKPIs?.outstanding||0).toFixed(2)} vs paid $${(finesKPIs?.paid||0).toFixed(2)} and waived $${(finesKPIs?.waived||0).toFixed(2)}. Median $${(finesKPIs?.med||0).toFixed(2)}; P95 $${(finesKPIs?.p95||0).toFixed(2)}.`}
                  </span>
                )}
              </div>
              {finesKPIs?.topBorrowers?.length ? (
                <div className="rounded-lg border bg-white p-3">
                  <div className="mb-2 text-sm font-medium">Top Borrowers by Outstanding</div>
                  <ul className="text-sm space-y-1">
                    {finesKPIs.topBorrowers.map(tb => (
                      <li key={tb.id} className="flex justify-between"><span>{tb.name}</span><span>${tb.outstanding.toFixed(2)}</span></li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            {activeReport === "overdue" && <OverdueReportTable data={overdueFilteredRows} loading={loading} />}
            {activeReport === "fines" && (
              <div className="overflow-x-auto">
                {finesFilteredRows.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No fines to display</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                      <tr>
                        <Th>Borrower</Th>
                        <Th>Patron ID</Th>
                        <Th>Fine ID</Th>
                        <Th>Status</Th>
                        <Th>Assessed</Th>
                        <Th>Amount</Th>
                        <Th>Paid</Th>
                        <Th>Outstanding</Th>
                        <Th>Reason</Th>
                        <Th>Item Title</Th>
                        <Th>Media</Th>
                        <Th>Due</Th>
                        <Th>Days</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {finesFilteredRows.map((r, idx) => {
                        const outstanding = Math.max(0, Number(r.amount_assessed||0) - Number(r.amount_paid||0));
                        return (
                          <tr key={idx} className="border-t">
                            <Td>{`${r.first_name} ${r.last_name}`}</Td>
                            <Td>{String(r.patron_id ?? r.user_id ?? '')}</Td>
                            <Td>#{r.fine_id}</Td>
                            <Td>{String(r.status||'').toUpperCase()}</Td>
                            <Td>{r.assessed_at ? new Date(r.assessed_at).toLocaleDateString() : '—'}</Td>
                            <Td>${Number(r.amount_assessed||0).toFixed(2)}</Td>
                            <Td>${Number(r.amount_paid||0).toFixed(2)}</Td>
                            <Td>${outstanding.toFixed(2)}</Td>
                            <Td>{r.reason || '—'}</Td>
                            <Td className="max-w-[30ch] truncate" title={r.title}>{r.title}</Td>
                            <Td>{(r.media_type||'book').toUpperCase()}</Td>
                            <Td>{r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}</Td>
                            <Td>{r.days_overdue}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {activeReport === "balances" && <BalancesReportTable data={reportData} loading={loading} />}
            {activeReport === "topItems" && <TopItemsReportTable data={reportData} loading={loading} />}
            {activeReport === "newPatrons" && <NewPatronsReportTable data={reportData} loading={loading} />}
            {activeReport === "transactions" && (
              <>
                {transactionsFilteredRows.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b bg-gray-50">
                    <div className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-600">Requests</div>
                      <div className="text-xl font-semibold">{transactionsKPIs?.requests ?? 0}</div>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-600">Approvals</div>
                      <div className="text-xl font-semibold">{transactionsKPIs?.approvals ?? 0}</div>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-600">Rejections</div>
                      <div className="text-xl font-semibold">{transactionsKPIs?.rejections ?? 0}</div>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-600">Approval Rate</div>
                      <div className="text-xl font-semibold">{Math.round((transactionsKPIs?.approvalRate || 0)*100)}%</div>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-600">Avg Time → Approval</div>
                      <div className="text-sm font-medium">{transactionsKPIs?.avgTimeToApprovalH ?? 0} h (med {transactionsKPIs?.medTimeToApprovalH ?? 0} h, p90 {transactionsKPIs?.p90TimeToApprovalH ?? 0} h)</div>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-600">Avg Time → Return</div>
                      <div className="text-sm font-medium">{transactionsKPIs?.avgTimeToReturnH ?? 0} h</div>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-600">Pending Queue</div>
                      <div className="text-xl font-semibold">{transactionsKPIs?.pendingQueue ?? 0}</div>
                    </div>
                  </div>
                ) : null}
                <TransactionReportTable data={transactionsFilteredRows} loading={loading} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
