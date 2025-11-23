import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Th, Td } from "./shared/CommonComponents";
import { ToastBanner } from "./shared/Feedback";
import { formatDate } from "../../utils";

const numberFormatter = new Intl.NumberFormat();
const donutPalette = ["#2563eb", "#10b981", "#f97316", "#a855f7", "#0ea5e9", "#ef4444"];
const timeframePresets = [
  { label: "By Day", value: "day" },
  { label: "By Week", value: "week" },
  { label: "By Month", value: "month" },
  { label: "By 3 Months", value: "quarter" },
  { label: "By Year", value: "year" },
];
const fallbackUserTypeOptions = ["student", "faculty", "staff", "community"];
const transactionEventOptions = ["checked_out", "returned"];
const backendEventMappings = {
  checked_out: ["checked_out", "checkout", "approved", "requested"],
  returned: ["returned", "return"],
};

const normalizeEventCode = (value = "") => value.replace(/\s+/g, "_").toLowerCase();
const isCheckoutEventType = (value = "") => {
  const code = normalizeEventCode(value);
  return code === "checked_out" || code === "checkout" || code === "approved" || code === "requested";
};
const isReturnEventType = (value = "") => {
  const code = normalizeEventCode(value);
  return code === "returned" || code === "return";
};
const canonicalEventCode = (value = "") => {
  if (isCheckoutEventType(value)) return "checked_out";
  if (isReturnEventType(value)) return "returned";
  return normalizeEventCode(value);
};
const formatEventTypeLabel = (value = "") => {
  const code = canonicalEventCode(value);
  if (code === "checked_out") return "Checked Out";
  if (code === "returned") return "Returned";
  const friendly = code.replace(/_/g, " ").trim();
  if (!friendly) return "--";
  return friendly
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
};
const getEventTypePillClasses = (value = "") => {
  const code = canonicalEventCode(value);
  if (code === "checked_out") {
    return "bg-blue-100 text-blue-800";
  }
  if (code === "returned") {
    return "bg-gray-100 text-gray-800";
  }
  return "bg-gray-100 text-gray-600";
};
const expandEventFilters = (values = []) => {
  const expanded = new Set();
  values.forEach((value) => {
    const code = canonicalEventCode(value);
    const rawValues = backendEventMappings[code] || [code];
    rawValues.forEach((raw) => {
      if (raw) expanded.add(raw);
    });
  });
  return Array.from(expanded);
};

function CheckboxMultiSelect({
  label,
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Search...",
  searchable = true,
  loading = false,
  helperText = "",
  emptyLabel = "No options available",
}) {
  const [query, setQuery] = useState("");
  const safeSelected = Array.isArray(selectedValues) ? selectedValues : [];
  const safeOptions = Array.isArray(options) ? options : [];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return safeOptions;
    return safeOptions.filter((opt) => {
      const labelMatch = (opt.label || "").toLowerCase().includes(term);
      const metaMatch = (opt.meta || "").toLowerCase().includes(term);
      return labelMatch || metaMatch;
    });
  }, [safeOptions, query]);

  const toggleValue = (value) => {
    if (!value) return;
    const next = safeSelected.includes(value)
      ? safeSelected.filter((v) => v !== value)
      : [...safeSelected, value];
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
      {searchable && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
        />
      )}
      <div className="multiselect-list">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">{emptyLabel}</div>
        ) : (
          filtered.map((opt) => (
            <label key={opt.value} className="multiselect-option">
              <input
                type="checkbox"
                className="multiselect-checkbox"
                checked={safeSelected.includes(opt.value)}
                onChange={() => toggleValue(opt.value)}
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-900">{opt.label}</span>
                {opt.meta ? <span className="text-xs text-gray-500">{opt.meta}</span> : null}
              </div>
            </label>
          ))
        )}
      </div>
      {helperText ? <p className="text-xs text-red-600">{helperText}</p> : null}
    </div>
  );
}

function SearchableDropdown({
  label,
  options = [],
  value = "",
  onChange,
  placeholder = "Search...",
  emptyLabel = "No options found",
  helperText = "",
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const safeOptions = Array.isArray(options) ? options : [];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return safeOptions;
    return safeOptions.filter((opt) => {
      const labelMatch = (opt.label || "").toLowerCase().includes(term);
      const metaMatch = (opt.meta || "").toLowerCase().includes(term);
      return labelMatch || metaMatch;
    });
  }, [safeOptions, query]);

  useEffect(() => {
    const match = safeOptions.find((opt) => opt.value === value);
    setQuery(match ? match.label : "");
  }, [safeOptions, value]);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue === value ? "" : nextValue);
  };

  const visible = filtered;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        {label ? <label className="text-xs font-medium text-gray-600">{label}</label> : null}
        {value ? (
          <button
            type="button"
            onClick={() => handleSelect("")}
            className="text-[11px] text-blue-600 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="dropdown-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="dropdown-input w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm disabled:opacity-60"
        />
        <span className="dropdown-input-icon" aria-hidden="true">{'\u25BE'}</span>
      </div>
      <div className={`rounded-md border bg-white ${disabled ? "pointer-events-none opacity-60" : ""}`}>
        {disabled ? (
          <div className="px-3 py-2 text-sm text-gray-500">Generate the report to load options.</div>
        ) : visible.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">{emptyLabel}</div>
        ) : (
          <div className="dropdown-options-scroll">
            {visible.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                  value === opt.value ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                {opt.meta ? <span className="text-xs text-gray-500">{opt.meta}</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>
      {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
    </div>
  );
}

const toTitle = (value = "") =>
  value
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value).toFixed(1);
  if (value > 0) return `▲ ${abs}%`;
  if (value < 0) return `▼ ${abs}%`;
  return "▬ 0%";
}

function SparklineChart({ data, valueKey, color = "#2563eb", fill = "rgba(37,99,235,0.18)", height = 140 }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="h-[140px] flex items-center justify-center text-sm text-gray-500">No data yet</div>;
  }
  const safeData = data.map((entry) => Number(entry?.[valueKey] || 0));
  const maxValue = Math.max(...safeData, 0);
  if (maxValue === 0) {
    return <div className="h-[140px] flex items-center justify-center text-sm text-gray-500">No data yet</div>;
  }
  const domainMax = maxValue;
  const stepX = data.length === 1 ? 100 : 100 / (data.length - 1);
  const points = safeData.map((value, idx) => {
    const x = idx * stepX;
    const y = 100 - (value / domainMax) * 100;
    return { x, y, label: data[idx].label, raw: value, change: data[idx].changePercent };
  });
  const polygonPoints = [
    `0,100`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},100`,
  ].join(" ");

  return (
    <div style={{ height, width: '100%', position: 'relative', overflow: 'hidden' }} className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }}>
        <polygon points={polygonPoints} fill={fill} />
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {points.map((point, idx) => (
          <circle key={`${point.x}-${idx}`} cx={point.x} cy={point.y} r={1.8} fill={color}>
            <title>
              {`${point.label}: ${numberFormatter.format(point.raw)} new patrons${
                point.change === null || point.change === undefined
                  ? ""
                  : ` (${formatPercent(point.change)})`
              }`}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ title, breakdown, total, palette = donutPalette }) {
  const entries = Object.entries(breakdown || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
  if (!entries.length) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-sm text-gray-500 mt-6">No breakdown data yet.</p>
      </div>
    );
  }
  const totalValue = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0) || 1;
  let currentPercent = 0;
  const slices = entries.map(([label, value], idx) => {
    const percent = (Number(value || 0) / totalValue) * 100;
    const slice = {
      label,
      value: Number(value || 0),
      percent,
      color: palette[idx % palette.length],
      start: currentPercent,
      end: currentPercent + percent,
    };
    currentPercent += percent;
    return slice;
  });
  const gradientStops = slices
    .map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`)
    .join(", ");

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-4">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${gradientStops})` }} />
          <div className="absolute inset-6 rounded-full bg-white flex flex-col items-center justify-center text-center">
            <span className="text-lg font-semibold">{numberFormatter.format(total)}</span>
            <span className="text-xs text-gray-500">total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-2 text-sm">
          {slices.slice(0, 5).map((slice) => (
            <li key={slice.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="flex-1 text-gray-700 capitalize">{slice.label}</span>
              <span className="text-gray-900 font-medium">{numberFormatter.format(slice.value)}</span>
              <span className="text-gray-500 text-xs">{slice.percent.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TopPeriodCard({ period }) {
  const percentLabel =
    typeof period.percent_of_total === "number"
      ? `${period.percent_of_total.toFixed(1)}% of total`
      : "—";
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Top period</p>
      <p className="text-sm font-semibold text-gray-900">{period.label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{numberFormatter.format(period.total || 0)}</p>
      <p className="text-xs text-gray-500 mt-1">{percentLabel}</p>
      <p className="text-xs text-gray-500 mt-1">
        {period.start_date === period.end_date
          ? period.start_date
          : `${period.start_date} → ${period.end_date}`}
      </p>
    </div>
  );
}

function RetentionSnapshotCard({ retention, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-center text-sm text-gray-500">
        Loading retention…
      </div>
    );
  }
  if (!retention) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Retention Snapshot</p>
        <p className="text-sm text-gray-500 mt-4">Not enough data yet.</p>
      </div>
    );
  }
  const { cohortLabel, cohortSize, engagedCount, engagementRate, windowStart, windowEnd } = retention;
  const hasCohort = cohortSize > 0;
  const numericRate = typeof engagementRate === "number" ? engagementRate : 0;
  const progressWidth = Math.min(100, Math.max(0, numericRate || 0));
  const rateLabel = hasCohort ? `${numericRate.toFixed(1)}%` : "—";
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-3">
      <div>
        <p className="text-sm text-gray-500">Retention Snapshot</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{rateLabel}</p>
        <p className="text-xs text-gray-500">
          {hasCohort
            ? `${engagedCount} of ${cohortSize} patrons from ${cohortLabel || "recent cohort"}`
            : "Waiting for at least one new patron in the last 30 days"}
        </p>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${progressWidth}%` }} />
      </div>
      <p className="text-xs text-gray-500">
        {hasCohort && windowStart
          ? `Looks at checkouts between ${windowStart} and ${windowEnd}`
          : "We need recent checkout activity to calculate retention."}
      </p>
    </div>
  );
}

function NewPatronInsights({ report, loading }) {
  if (!report) return null;
  const timeline = Array.isArray(report.timeline) ? report.timeline : [];
  const meta = report.meta || {};
  const breakdowns = report.breakdowns || {};
  const topPeriods = Array.isArray(report.topPeriods) ? report.topPeriods : [];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">New Patrons Over Time</p>
              <p className="text-2xl font-semibold text-gray-900">{numberFormatter.format(meta.totalNewPatrons || 0)}</p>
              <p
                className={`text-xs ${
                  meta.lastChangePercent > 0
                    ? "text-green-600"
                    : meta.lastChangePercent < 0
                    ? "text-rose-600"
                    : "text-gray-500"
                }`}
              >
                {meta.lastChangePercent == null ? "Awaiting previous period" : formatPercent(meta.lastChangePercent)}
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Avg / {meta.timeframe || "period"}</p>
              <p className="font-semibold text-gray-900">
                {meta.averagePerBucket ? meta.averagePerBucket.toFixed(1) : "0.0"}
              </p>
            </div>
          </div>
          <SparklineChart data={timeline} valueKey="total" color="#2563eb" />
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cumulative Growth</p>
              <p className="text-2xl font-semibold text-gray-900">
                {numberFormatter.format(timeline.length ? timeline[timeline.length - 1].cumulative : 0)}
              </p>
              <p className="text-xs text-gray-500">{meta.startDate} → {meta.endDate}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Periods tracked</p>
              <p className="font-semibold text-gray-900">{meta.bucketCount || 0}</p>
            </div>
          </div>
          <SparklineChart data={timeline} valueKey="cumulative" color="#10b981" fill="rgba(16,185,129,0.25)" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DonutChart title="User Type Breakdown" breakdown={breakdowns.byType} total={meta.totalNewPatrons || 0} />
        <RetentionSnapshotCard retention={report.retention} loading={loading} />
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-900">Top Registration Periods</p>
          <span className="text-xs text-gray-500">
            Highlighting {topPeriods.length || 0} / {timeline.length || 0} periods
          </span>
        </div>
        {topPeriods.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {topPeriods.map((period) => (
              <TopPeriodCard key={`${period.label}-${period.start_date}`} period={period} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">We need more than one period with activity to surface leaders.</p>
        )}
      </div>
    </div>
  );
}

function NewPatronsReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) {
    return <div className="p-8 text-center text-gray-500">No patron signups in the selected window</div>;
  }
  const total = rows.reduce((sum, row) => sum + Number(row.new_patrons || 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Period</Th>
            <Th>New Patrons</Th>
            <Th>Cumulative</Th>
            <Th>% of Total</Th>
            <Th>Δ vs Prev</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const startLabel = row.start_date ? formatDate(row.start_date) : "—";
            const endLabel = row.end_date ? formatDate(row.end_date) : "—";
            const rowKey = `${row.period}-${row.start_date ?? row.period}`;
            return (
              <tr key={rowKey} className="border-t">
                <Td>
                  <div className="font-semibold text-gray-900">{row.period}</div>
                  <div className="text-xs text-gray-500">
                    {row.start_date && row.end_date && row.start_date !== row.end_date
                      ? `${startLabel} → ${endLabel}`
                      : startLabel}
                  </div>
                </Td>
              <Td>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.new_patrons > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {numberFormatter.format(row.new_patrons || 0)}
                </span>
              </Td>
              <Td className="font-medium text-gray-900">{numberFormatter.format(row.cumulative || 0)}</Td>
              <Td className="text-gray-900">
                {row.percent_of_total != null
                  ? `${Number(row.percent_of_total).toFixed(1)}%`
                  : "—"}
              </Td>
              <Td className="text-gray-900">{formatPercent(row.change_percent)}</Td>
            </tr>
            );
          })}
          <tr className="bg-gray-50 border-t">
            <Td className="font-semibold">Grand Total</Td>
            <Td className="font-semibold">{numberFormatter.format(total)}</Td>
            <Td className="font-semibold text-gray-500">—</Td>
            <Td className="font-semibold text-gray-500">100%</Td>
            <Td className="font-semibold text-gray-500">—</Td>
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

function TransactionReportTable({ data = [], loading }) {
  // client-side sorting
  const [sortKey, setSortKey] = React.useState('event_timestamp');
  const [sortDir, setSortDir] = React.useState('desc');
  const sorted = React.useMemo(() => {
    const arr = [...data].map((r, i) => ({ ...r, __i: i }));
    const cmp = (a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'event_timestamp') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else if (typeof av === 'string' && typeof bv === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return -1 * dir; if (av > bv) return 1 * dir; return a.__i - b.__i; // stable
    };
    arr.sort(cmp);
    return arr;
  }, [data, sortKey, sortDir]);
  if (loading) {
    return <div>Loading report...</div>;
  }
  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No loan activity in selected period</div>;
  }
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
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getEventTypePillClasses(
                    row.event_type || row.raw_type || ""
                  )}`}
                >
                  {formatEventTypeLabel(row.event_type || row.raw_type || "")}
                </span>
              </Td>
              <Td>{row.event_timestamp ? new Date(row.event_timestamp).toLocaleString() : '—'}</Td>
              <Td>
                {row.employee_first_name || row.employee_last_name
                  ? `${row.employee_first_name || ""} ${row.employee_last_name || ""}`.trim()
                  : "—"}
              </Td>
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
  const allTypes = transactionEventOptions;
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
    setEventTypes([...allTypes]);
    setStatuses(allStatuses);
    setStaff('');
    setSearch('');
    onRefresh && onRefresh();
  };
  const onClear = () => {
    setStartDate('');
    setEndDate('');
    setEventTypes([...allTypes]);
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
  const [toast, setToast] = useState(null);
  const showToast = useCallback((payload) => {
    if (!payload) return;
    setToast({ id: Date.now(), ...payload });
  }, []);
  
  // Date ranges for all reports
  const [overdueStartDate, setOverdueStartDate] = useState("");
  const [overdueEndDate, setOverdueEndDate] = useState("");
  const [selectedBorrowers, setSelectedBorrowers] = useState([]);
  const [overduePatronId, setOverduePatronId] = useState("");
  const [overdueMinDays, setOverdueMinDays] = useState(0);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState([]);
  const [selectedItemTitles, setSelectedItemTitles] = useState([]);
  const [overdueRecencySort, setOverdueRecencySort] = useState("recent");
  const [patronOptions, setPatronOptions] = useState([]);
  const [patronLoading, setPatronLoading] = useState(false);
  const [patronError, setPatronError] = useState("");

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
  
  const [balancesStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [balancesEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
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
  const [newPatronsTimeframe, setNewPatronsTimeframe] = useState("month");
  const [newPatronsUserTypes, setNewPatronsUserTypes] = useState([]);
  const [newPatronsReport, setNewPatronsReport] = useState(null);
  const [newPatronsFilterOptions, setNewPatronsFilterOptions] = useState({
    userTypes: [],
  });

  const [transactionsStartDate, setTransactionStartDate] = useState("");
  const [transactionsEndDate, setTransactionsEndDate] = useState("");
  // Pagination for transactions
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(50);
  const [txHasGenerated, setTxHasGenerated] = useState(false);
  const txPageRef = useRef(txPage);
  const txPageSizeRef = useRef(txPageSize);
  // Transactions filters
  const [txEventTypes, setTxEventTypes] = useState([...transactionEventOptions]);
  const [txStatuses, setTxStatuses] = useState(['Pending','Approved & Active','Rejected','Returned']);
  const [txPatronId, setTxPatronId] = useState("");
  const [txItemType, setTxItemType] = useState("");
  const [txItemTitle, setTxItemTitle] = useState("");
  const userTypeOptions = Array.from(
    new Set(
      (newPatronsFilterOptions.userTypes?.length ? newPatronsFilterOptions.userTypes : fallbackUserTypeOptions).map(
        (value) => value.toLowerCase()
      )
    )
  );

  useEffect(() => {
    txPageRef.current = txPage;
  }, [txPage]);

  useEffect(() => {
    txPageSizeRef.current = txPageSize;
  }, [txPageSize]);

  useEffect(() => {
    if (activeReport !== "overdue" || !api) return;
    let alive = true;
    (async () => {
      setPatronLoading(true);
      setPatronError("");
      try {
        const payload = await api("staff/patrons/search?limit=1200");
        if (!alive) return;
        const normalized = (Array.isArray(payload) ? payload : []).map((row) => {
          const id = row.user_id ?? row.account_id ?? row.employee_id ?? null;
          const labelInput = `${row.first_name || ""} ${row.last_name || ""}`.trim();
          const label = toTitle(labelInput) || row.email || (id ? `User #${id}` : "");
          return {
            value: id ? String(id) : "",
            label,
            meta: row.email || "",
          };
        }).filter((opt) => opt.value);
        const dedup = new Map();
        normalized.forEach((opt) => {
          if (!dedup.has(opt.value)) {
            dedup.set(opt.value, opt);
          }
        });
        const sorted = Array.from(dedup.values()).sort((a, b) => a.label.localeCompare(b.label));
        setPatronOptions(sorted);
      } catch (err) {
        if (!alive) return;
        setPatronOptions([]);
        setPatronError(err?.data?.error || err?.message || "Failed to load patrons.");
      } finally {
        if (alive) setPatronLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, activeReport]);

  const loadReport = useCallback(async (reportType, overrides = {}) => {
    if (!api) return;
    const targetReport = reportType || activeReport;
    setLoading(true);
    setError("");
    setReportData([]);
    if (targetReport === "newPatrons") {
      setNewPatronsReport(null);
    }
    if (targetReport === "transactions") {
      setTxHasGenerated(false);
    }

    let requestedTxPage = txPageRef.current;
    let requestedTxPageSize = txPageSizeRef.current;

    try {
      let endpoint = "";
      let params = new URLSearchParams();
      
      switch (targetReport) {
        case "overdue":
          endpoint = "reports/overdue";
          if (overdueStartDate) params.set("start_date", overdueStartDate);
          if (overdueEndDate) params.set("end_date", overdueEndDate);
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
          params.set("timeframe", newPatronsTimeframe);
          if (Array.isArray(newPatronsUserTypes) && newPatronsUserTypes.length) {
            params.set("user_type", newPatronsUserTypes.join(","));
          }
          break;
        case "transactions": {
          endpoint = "reports/transactions";
          if (transactionsStartDate) params.set("start_date", transactionsStartDate);
          if (transactionsEndDate) params.set("end_date", transactionsEndDate);
          const overridePage = Number(overrides.txPage);
          const overridePageSize = Number(overrides.txPageSize);
          requestedTxPage = Number.isFinite(overridePage) && overridePage > 0 ? overridePage : txPage;
          requestedTxPageSize = Number.isFinite(overridePageSize) && overridePageSize > 0 ? overridePageSize : txPageSize;
          if (Array.isArray(txEventTypes) && txEventTypes.length) {
            const rawEventFilters = expandEventFilters(txEventTypes);
            if (rawEventFilters.length) {
              params.set("types", rawEventFilters.join(","));
            }
          }
          if (Array.isArray(txStatuses) && txStatuses.length) params.set("statuses", txStatuses.join(","));
          break;
        }
        default:
          throw new Error("Unknown report type");
      }
      if (targetReport === "transactions") {
        const aggregatedRows = [];
        const fetchPageSize = Math.max(requestedTxPageSize, 250);
        let currentPage = 1;
        let expectedTotal = 0;
        const maxPages = 200;
        while (currentPage <= maxPages) {
          const pageParams = new URLSearchParams(params.toString());
          pageParams.set("page", String(currentPage));
          pageParams.set("pageSize", String(fetchPageSize));
          const payload = await api(`${endpoint}?${pageParams.toString()}`);
          const rows = Array.isArray(payload?.rows)
            ? payload.rows
            : Array.isArray(payload)
            ? payload
            : [];
          if (rows.length === 0) break;
          aggregatedRows.push(...rows);
          const payloadTotal = Number(payload?.total);
          if (Number.isFinite(payloadTotal) && payloadTotal >= 0) {
            expectedTotal = payloadTotal;
          } else if (aggregatedRows.length > expectedTotal) {
            expectedTotal = aggregatedRows.length;
          }
          if (
            (Number.isFinite(payloadTotal) && aggregatedRows.length >= payloadTotal) ||
            rows.length < fetchPageSize
          ) {
            break;
          }
          currentPage += 1;
        }
        setReportData(aggregatedRows);
        setTxPage(requestedTxPage);
        setTxPageSize(requestedTxPageSize);
        setTxHasGenerated(true);
        return;
      }

      const data = await api(`${endpoint}?${params.toString()}`);
      if (targetReport === "newPatrons") {
        setNewPatronsReport(data || null);
        setNewPatronsFilterOptions({
          userTypes: data?.filterOptions?.userTypes || [],
        });
        setReportData(Array.isArray(data?.tableRows) ? data.tableRows : []);
      } else {
        const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
        setReportData(rows);
      }
    } catch (err) {
      setError(err.message || "Failed to load report");
      if (targetReport === 'transactions') {
        setTxHasGenerated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [api, activeReport, overdueStartDate, overdueEndDate, balancesStartDate, balancesEndDate, topItemsStartDate, topItemsEndDate, newPatronsStartDate, newPatronsEndDate, newPatronsTimeframe, newPatronsUserTypes, transactionsStartDate, transactionsEndDate, txEventTypes, txStatuses]);

  // Derived media types from the currently loaded overdue dataset
  const mediaTypeOptions = useMemo(() => {
    const types = new Set((reportData || []).map(r => (r.media_type || 'book').toString().toLowerCase()));
    return Array.from(types).sort();
  }, [reportData]);
  const mediaTypeMultiOptions = useMemo(() => mediaTypeOptions.map((type) => ({
    value: type,
    label: type.toUpperCase(),
  })), [mediaTypeOptions]);
  const itemTitleOptions = useMemo(() => {
    const map = new Map();
    (reportData || []).forEach((row) => {
      const title = (row.title || "").trim();
      if (!title) return;
      if (!map.has(title)) {
        const meta = (row.media_type || "").toString().toUpperCase();
        map.set(title, { value: title, label: title, meta: meta || undefined });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [reportData]);
  const transactionPatronOptions = useMemo(() => {
    if (activeReport !== "transactions") return [];
    const map = new Map();
    (Array.isArray(reportData) ? reportData : []).forEach((row) => {
      const id = row.user_id ?? row.patron_id ?? row.account_id;
      if (!id) return;
      const rawName = `${row.user_first_name || ""} ${row.user_last_name || ""}`.trim();
      const labelName = rawName ? toTitle(rawName) : "";
      const label = labelName ? `${labelName} (#${id})` : `Patron #${id}`;
      const meta = row.user_email || "";
      map.set(String(id), {
        value: String(id),
        label,
        meta: meta || undefined,
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [activeReport, reportData]);
  const transactionItemTypeOptions = useMemo(() => {
    if (activeReport !== "transactions") return [];
    const types = new Set();
    (Array.isArray(reportData) ? reportData : []).forEach((row) => {
      const raw = (row.media_type || row.item_type || "").toString().trim();
      if (!raw) return;
      types.add(raw.toLowerCase());
    });
    return Array.from(types)
      .sort()
      .map((type) => ({
        value: type,
        label: type.toUpperCase(),
      }));
  }, [activeReport, reportData]);
  const transactionItemTitleOptions = useMemo(() => {
    if (activeReport !== "transactions") return [];
    const map = new Map();
    (Array.isArray(reportData) ? reportData : []).forEach((row) => {
      const title = (row.item_title || "").trim();
      if (!title) return;
      map.set(title.toLowerCase(), {
        value: title,
        label: title,
        meta: row.media_type ? String(row.media_type).toUpperCase() : undefined,
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [activeReport, reportData]);

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
    const minDays = Number.isFinite(Number(overdueMinDays)) ? Number(overdueMinDays) : 0;
    const borrowerSet = new Set((selectedBorrowers || []).map((id) => String(id)));
    const borrowerActive = borrowerSet.size > 0;
    const mediaSet = new Set((selectedMediaTypes || []).map((mt) => mt.toLowerCase()));
    const mediaActive = mediaSet.size > 0;
    const titleSet = new Set((selectedItemTitles || []).map((title) => title));
    const titleActive = titleSet.size > 0;
    const filtered = (reportData || []).filter(r => {
      const daysOk = Number(r.days_overdue || 0) >= minDays;
      const borrowerId = String(r.patron_id ?? r.user_id ?? '');
      const borrowerOk = !borrowerActive || (borrowerId && borrowerSet.has(borrowerId));
      const pidOk = !pidActive || borrowerId.toLowerCase().includes(pidLower);
      const mediaValue = String(r.media_type || 'book').toLowerCase();
      const mediaOk = !mediaActive || mediaSet.has(mediaValue);
      const titleValue = (r.title || "").trim();
      const titleOk = !titleActive || titleSet.has(titleValue);
      return daysOk && borrowerOk && pidOk && mediaOk && titleOk;
    });
    const parseDue = (value) => {
      const ts = Date.parse(value);
      return Number.isNaN(ts) ? 0 : ts;
    };
    return [...filtered].sort((a, b) => {
      const diff = parseDue(a.due_date) - parseDue(b.due_date);
      return overdueRecencySort === 'recent' ? -diff : diff;
    });
  }, [activeReport, reportData, overdueMinDays, overduePatronId, selectedBorrowers, selectedMediaTypes, selectedItemTitles, overdueRecencySort]);

  // KPI calculations for overdue
  const overdueKPIs = useMemo(() => {
    if (activeReport !== 'overdue') return null;
    const rows = overdueFilteredRows;
    if (!rows.length) {
      return { total: 0, uniqueBorrowers: 0, avg: 0, med: 0, max: 0 };
    }
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
    const sourceRows = Array.isArray(reportData) ? reportData : [];
    if (activeReport !== "transactions" || !txHasGenerated) return sourceRows;
    const typeSet = new Set(txEventTypes.map((value) => canonicalEventCode(value)));
    const typeActive = typeSet.size > 0;
    const statuses = new Set(txStatuses);
    const patronFilter = txPatronId ? txPatronId.toLowerCase() : "";
    const itemTypeFilter = txItemType ? txItemType.toLowerCase() : "";
    const itemTitleFilter = txItemTitle ? txItemTitle.toLowerCase() : "";
    return sourceRows.filter((r) => {
      const rowEventCode = canonicalEventCode(r.event_type || r.raw_type || "");
      const typeOk = !typeActive || !rowEventCode || typeSet.has(rowEventCode);
      const statusOk = !r.current_status || statuses.has(String(r.current_status));
      const patronValue = String(r.user_id ?? r.patron_id ?? r.account_id ?? "");
      const patronOk = !patronFilter || patronValue.toLowerCase() === patronFilter;
      const rowType = String(r.media_type || r.item_type || "").trim().toLowerCase();
      const itemTypeOk = !itemTypeFilter || rowType === itemTypeFilter;
      const rowTitle = String(r.item_title || "").trim().toLowerCase();
      const itemTitleOk = !itemTitleFilter || rowTitle === itemTitleFilter;
      return typeOk && statusOk && patronOk && itemTypeOk && itemTitleOk;
    });
  }, [activeReport, reportData, txEventTypes, txStatuses, txPatronId, txItemType, txItemTitle, txHasGenerated]);

  const filteredTransactionCount = txHasGenerated ? transactionsFilteredRows.length : 0;
  const totalTransactionsCount = txHasGenerated ? reportData.length : 0;

  const transactionsKPIs = useMemo(() => {
    if (activeReport !== "transactions" || !txHasGenerated) return null;
    const rows = transactionsFilteredRows;
    const byLoan = new Map();
    rows.forEach((row) => {
      const key = row.loan_id || `loan-${row.copy_id || row.transaction_id || Math.random()}`;
      const bucket = byLoan.get(key) || [];
      bucket.push(row);
      byLoan.set(key, bucket);
    });
    const ttr = [];
    let activeLoans = 0;
    let overdueCount = 0;
    let lostCount = 0;
    byLoan.forEach((events) => {
      events.sort((a, b) => new Date(a.event_timestamp) - new Date(b.event_timestamp));
      const firstCheckout = events.find((event) => isCheckoutEventType(event.event_type || event.raw_type));
      const firstReturn = events.find((event) => isReturnEventType(event.event_type || event.raw_type));
      if (firstCheckout && firstReturn) {
        ttr.push(new Date(firstReturn.event_timestamp) - new Date(firstCheckout.event_timestamp));
      }
      const latest = events[events.length - 1] || {};
      const statusCode = normalizeEventCode(latest.current_status || latest.event_type || "");
      const isReturned = statusCode.includes("returned") || isReturnEventType(latest.current_status || latest.event_type);
      const isLost =
        statusCode.includes("lost") ||
        events.some((event) => normalizeEventCode(event.event_type || event.raw_type || "").includes("lost"));
      const isOverdue = statusCode.includes("overdue");
      if (isLost) {
        lostCount += 1;
        return;
      }
      if (!isReturned) {
        activeLoans += 1;
        if (isOverdue) {
          overdueCount += 1;
        }
      }
    });
    const avg = (arr) => (arr.length ? arr.reduce((sum, value) => sum + value, 0) / arr.length : 0);
    const msToHours = (ms) => Math.round((ms / 36e5) * 10) / 10;
    const avgReturnHours = msToHours(avg(ttr));
    const overduePercent = activeLoans ? (overdueCount / activeLoans) * 100 : 0;
    return {
      activeLoans,
      avgReturnHours,
      overdueCount,
      overduePercent,
      lostCount,
    };
  }, [activeReport, transactionsFilteredRows, txHasGenerated]);

  const paginatedTransactions = useMemo(() => {
    if (activeReport !== "transactions" || !txHasGenerated) return [];
    const start = (txPage - 1) * txPageSize;
    return transactionsFilteredRows.slice(start, start + txPageSize);
  }, [activeReport, txHasGenerated, transactionsFilteredRows, txPage, txPageSize]);
  const filteredMaxPage = Math.max(1, Math.ceil((filteredTransactionCount || 0) / txPageSize));

  useEffect(() => {
    if (activeReport !== "transactions" || !txHasGenerated) return;
    const maxPage = Math.max(1, Math.ceil((filteredTransactionCount || 0) / txPageSize));
    if (txPage > maxPage) {
      setTxPage(maxPage);
    }
  }, [activeReport, txHasGenerated, filteredTransactionCount, txPageSize, txPage]);

  // Fines filtering and KPIs
  // Legacy fines filtering/KPIs removed until the fines report is re-enabled

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
  function onReset() {
    const d = new Date(); const lastMonth = new Date(d.getFullYear(), d.getMonth()-1, d.getDate());
    setOverdueStartDate(lastMonth.toISOString().slice(0,10));
    setOverdueEndDate(new Date().toISOString().slice(0,10));
    setSelectedBorrowers([]);
    setSelectedItemTitles([]);
    setOverduePatronId("");
    setOverdueMinDays(0);
    setSelectedMediaTypes([]);
    setOverdueRecencySort("recent");
  }

  const handleUserTypeToggle = (type) => {
    setNewPatronsUserTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  function handleNewPatronsReset() {
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    setNewPatronsStartDate(yearAgo.toISOString().slice(0, 10));
    setNewPatronsEndDate(new Date().toISOString().slice(0, 10));
    setNewPatronsTimeframe("month");
    setNewPatronsUserTypes([]);
    loadReport("newPatrons");
  }

  const newPatronFiltersSection = (
    <div className="space-y-4 rounded-md border bg-white/80 p-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Time Frame</label>
        <div className="flex flex-wrap gap-2">
          {timeframePresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setNewPatronsTimeframe(preset.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                newPatronsTimeframe === preset.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={newPatronsStartDate}
            onChange={(e) => setNewPatronsStartDate(e.target.value)}
            className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={newPatronsEndDate}
            onChange={(e) => setNewPatronsEndDate(e.target.value)}
            className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-600">User Types</label>
            <button
              type="button"
              onClick={() => setNewPatronsUserTypes([])}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {userTypeOptions.map((type) => {
              const value = type.toLowerCase();
              return (
                <label key={value} className="inline-flex items-center gap-1 text-xs capitalize cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPatronsUserTypes.includes(value)}
                    onChange={() => handleUserTypeToggle(value)}
                    className="h-4 w-4"
                  />
                  {toTitle(value)}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Leave unchecked to include every patron type.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <button
          type="button"
          onClick={handleNewPatronsReset}
          disabled={loading}
          className="px-3 py-2 rounded-md bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset Filters
        </button>
        <span>Filters auto-apply and refresh charts instantly.</span>
      </div>
    </div>
  );

  useEffect(() => {
    if (activeReport === "transactions") return;
    if (activeReport === "overdue") {
      if (overdueStartDate && overdueEndDate && new Date(overdueEndDate) < new Date(overdueStartDate)) {
        setError('End date cannot be before start date');
        return;
      }
      loadReport('overdue');
      return;
    }
    loadReport(activeReport);
  }, [activeReport, loadReport, overdueStartDate, overdueEndDate]);

  useEffect(() => {
    if (activeReport !== "transactions") return;
    loadReport("transactions");
  }, [activeReport, loadReport, transactionsStartDate, transactionsEndDate, txEventTypes, txStatuses]);

  useEffect(() => {
    if (activeReport === "transactions") return;
    setTxPatronId("");
    setTxItemType("");
    setTxItemTitle("");
  }, [activeReport]);

  useEffect(() => {
    if (activeReport !== "overdue") return;
    setReportData([]);
  }, [activeReport]);

  useEffect(() => {
    if (activeReport !== "transactions") return;
    loadReport("transactions", { txPage, txPageSize });
  }, [activeReport, txPage, txPageSize, loadReport]);

  // handleRefresh removed (unused)

  function handleExport() {
    const exportRows = activeReport === 'overdue' ? overdueFilteredRows : (activeReport === 'transactions' ? transactionsFilteredRows : reportData);
    if (!exportRows || exportRows.length === 0) { 
      showToast({ type: "error", text: "No data to export" });
      return;
    }
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
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
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
            {/* Fines and User Balances removed */}
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

          {activeReport === "overdue" && (
            <div className="overdue-report-layout">
              <aside className="overdue-report-sidebar">
                <div className="rounded-md border bg-white p-4 overdue-filters-panel">
                  <div className="overdue-filters-scroll space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={overdueStartDate}
                        onChange={(e) => setOverdueStartDate(e.target.value)}
                        className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={overdueEndDate}
                        onChange={(e) => setOverdueEndDate(e.target.value)}
                        className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                      />
                    </div>
                  </div>
                  <CheckboxMultiSelect
                    label="Borrowers"
                    options={patronOptions}
                    selectedValues={selectedBorrowers}
                    onChange={setSelectedBorrowers}
                    placeholder="Search patrons"
                    loading={patronLoading}
                    helperText={patronError}
                    emptyLabel="No patrons found"
                  />
                  <CheckboxMultiSelect
                    label="Item Titles"
                    options={itemTitleOptions}
                    selectedValues={selectedItemTitles}
                    onChange={setSelectedItemTitles}
                    placeholder="Search item titles"
                    emptyLabel={itemTitleOptions.length ? "No titles match search" : "No items yet"}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Patron ID</label>
                    <input
                      type="text"
                      placeholder="partial match"
                      value={overduePatronId}
                      onChange={(e) => setOverduePatronId(e.target.value)}
                      className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min Days Overdue</label>
                    <input
                      type="number"
                      min="0"
                      value={overdueMinDays}
                      onChange={(e) => setOverdueMinDays(e.target.value)}
                      className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <CheckboxMultiSelect
                    label="Media Types"
                    options={mediaTypeMultiOptions}
                    selectedValues={selectedMediaTypes}
                    onChange={setSelectedMediaTypes}
                    searchable={false}
                    emptyLabel={mediaTypeOptions.length ? "No media types match" : "Load report to see media types"}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sort By Due Date</label>
                    <select
                      value={overdueRecencySort}
                      onChange={(e) => setOverdueRecencySort(e.target.value)}
                      className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    >
                      <option value="recent">Most recent → oldest</option>
                      <option value="oldest">Oldest → most recent</option>
                    </select>
                  </div>
                  </div>
                  <div className="overdue-filters-actions">
                    <p className="text-xs text-gray-500 text-center">Results update automatically as you adjust filters.</p>
                    <button
                      type="button"
                      onClick={onReset}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </aside>
              <div className="overdue-report-content space-y-4">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md border bg-white p-3 text-sm">
                      <div className="text-gray-500 whitespace-nowrap">Total Overdue</div>
                      <div className="text-xl font-semibold">{overdueKPIs?.total ?? 0}</div>
                    </div>
                    <div className="rounded-md border bg-white p-3 text-sm">
                      <div className="text-gray-500 whitespace-nowrap">Distinct Borrowers</div>
                      <div className="text-xl font-semibold">{overdueKPIs?.uniqueBorrowers ?? 0}</div>
                    </div>
                    <div className="rounded-md border bg-white p-3 text-sm">
                      <div className="text-gray-500 whitespace-nowrap">Avg Days</div>
                      <div className="text-xl font-semibold">{overdueKPIs?.avg ?? 0}</div>
                    </div>
                    <div className="rounded-md border bg-white p-3 text-sm">
                      <div className="text-gray-500 whitespace-nowrap">Median / Max</div>
                      <div className="text-xl font-semibold whitespace-nowrap">
                        {overdueKPIs?.med ?? 0} / {overdueKPIs?.max ?? 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {overdueFilteredRows.length === 0 ? (
                      <span>No overdue items matched the selected parameters.</span>
                    ) : (
                      <span>
                        {`There are ${overdueKPIs?.total ?? 0} overdue items across ${overdueKPIs?.uniqueBorrowers ?? 0} patrons. Average delay is ${overdueKPIs?.avg ?? 0} days with a median of ${overdueKPIs?.med ?? 0} and maximum of ${overdueKPIs?.max ?? 0}.`}
                      </span>
                    )}
                  </div>
                </div>
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                <div className="rounded-lg border overflow-hidden">
                  <OverdueReportTable data={overdueFilteredRows} loading={loading} />
                </div>
              </div>
            </div>
          )}

          {/* Filters section - now below the panels */}
          {activeReport !== "overdue" && activeReport !== "newPatrons" && (
          <div className="space-y-3">
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

          {error && activeReport !== "overdue" && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {activeReport === "newPatrons" ? (
            <div className="new-patrons-report-layout">
              <aside className="new-patrons-report-sidebar">{newPatronFiltersSection}</aside>
              <div className="new-patrons-report-content space-y-4">
                <NewPatronInsights report={newPatronsReport} loading={loading} />
                <div className="rounded-lg border overflow-hidden">
                  <NewPatronsReportTable data={reportData} loading={loading} />
                </div>
              </div>
            </div>
          ) : activeReport === "transactions" ? (
            <div className="transaction-report-layout">
              <aside className="transaction-report-sidebar">
                <div className="rounded-md border bg-white p-4 space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={transactionsStartDate}
                        onChange={(e) => {
                          setTransactionStartDate(e.target.value);
                          setTxPage(1);
                        }}
                        className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={transactionsEndDate}
                        onChange={(e) => {
                          setTransactionsEndDate(e.target.value);
                          setTxPage(1);
                        }}
                        className="w-full rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Event Type</label>
                    <div className="flex gap-3 flex-wrap pb-1">
                      {transactionEventOptions.map((type) => (
                        <label key={type} className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={txEventTypes.includes(type)}
                            onChange={() => {
                              setTxEventTypes((prev) =>
                                prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
                              );
                              setTxPage(1);
                            }}
                            className="w-4 h-4"
                          />
                          <span>{formatEventTypeLabel(type)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Current Status</label>
                    <div className="flex gap-3 flex-wrap pb-1">
                      {["Pending", "Approved & Active", "Rejected", "Returned"].map((status) => (
                        <label key={status} className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={txStatuses.includes(status)}
                            onChange={() => {
                              setTxStatuses((prev) => (prev.includes(status) ? prev.filter((x) => x !== status) : [...prev, status]));
                              setTxPage(1);
                            }}
                            className="w-4 h-4"
                          />
                          <span>{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <SearchableDropdown
                    label="Patron"
                    options={transactionPatronOptions}
                    value={txPatronId}
                    onChange={setTxPatronId}
                    placeholder="Search patrons"
                    helperText="Includes patron ID alongside the name."
                    disabled={!txHasGenerated}
                  />
                  <SearchableDropdown
                    label="Item Type"
                    options={transactionItemTypeOptions}
                    value={txItemType}
                    onChange={setTxItemType}
                    placeholder="Search item types"
                    helperText="Matches media/item formats on each loan."
                    disabled={!txHasGenerated}
                  />
                  <SearchableDropdown
                    label="Item Name"
                    options={transactionItemTitleOptions}
                    value={txItemTitle}
                    onChange={setTxItemTitle}
                    placeholder="Search item names"
                    helperText="Choose a specific title to filter results."
                    disabled={!txHasGenerated}
                  />
                  <div className="pt-1 space-y-2">
                    <p className="text-xs text-gray-500">Filters update automatically as you make changes.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const d = new Date();
                          const sd = new Date();
                          sd.setFullYear(sd.getFullYear() - 1);
                          setTransactionStartDate(sd.toISOString().slice(0, 10));
                          setTransactionsEndDate(d.toISOString().slice(0, 10));
                          setTxEventTypes([...transactionEventOptions]);
                          setTxStatuses(["Pending", "Approved & Active", "Rejected", "Returned"]);
                          setTxPatronId("");
                          setTxItemType("");
                          setTxItemTitle("");
                          setTxPage(1);
                        }}
                        disabled={loading}
                        className="flex-1 px-3 py-2 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => {
                          setTransactionStartDate("");
                          setTransactionsEndDate("");
                          setTxEventTypes([...transactionEventOptions]);
                          setTxStatuses(["Pending", "Approved & Active", "Rejected", "Returned"]);
                          setTxPatronId("");
                          setTxItemType("");
                          setTxItemTitle("");
                          setTxPage(1);
                        }}
                        disabled={loading}
                        className="flex-1 px-3 py-2 rounded-md bg-white border text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
              <div className="transaction-report-content flex-1 rounded-lg border bg-white">
                {!txHasGenerated ? (
                  <div className="p-6 text-sm text-gray-500">
                    {loading
                      ? "Loading transaction history..."
                      : error
                      ? "Unable to load transaction history."
                      : "No transaction activity found yet."}
                  </div>
                ) : (
                  <>
                    {filteredTransactionCount > 0 ? (
                      <div className="flex flex-wrap gap-3 p-4 border-b bg-gray-50">
                        <div className="h-32 w-full rounded-lg border bg-white p-3 text-left sm:h-32 sm:w-40 lg:w-44 tx-kpi-card">
                          <div className="tx-kpi-label">Items Out</div>
                          <div className="tx-kpi-value">{transactionsKPIs?.activeLoans ?? 0}</div>
                          <p className="tx-kpi-description">Currently on loan</p>
                        </div>
                        <div className="h-32 w-full rounded-lg border bg-white p-3 text-left sm:h-32 sm:w-40 lg:w-44 tx-kpi-card">
                          <div className="tx-kpi-label">Avg Return</div>
                          <div className="tx-kpi-value">
                            {(transactionsKPIs?.avgReturnHours ?? 0).toFixed(1)}h
                          </div>
                          <p className="tx-kpi-description">Approval → return</p>
                        </div>
                        <div className="h-32 w-full rounded-lg border bg-white p-3 text-left sm:h-32 sm:w-40 lg:w-44 tx-kpi-card">
                          <div className="tx-kpi-label">Overdue</div>
                          <div className="tx-kpi-value">{transactionsKPIs?.overdueCount ?? 0}</div>
                          <p className="tx-kpi-description">
                            {(transactionsKPIs?.overduePercent ?? 0).toFixed(1)}% of active
                          </p>
                        </div>
                        <div className="h-32 w-full rounded-lg border bg-white p-3 text-left sm:h-32 sm:w-40 lg:w-44 tx-kpi-card">
                          <div className="tx-kpi-label">Lost Items</div>
                          <div className="tx-kpi-value">{transactionsKPIs?.lostCount ?? 0}</div>
                          <p className="tx-kpi-description">Latest status is lost</p>
                        </div>
                      </div>
                    ) : null}
                    <TransactionReportTable data={paginatedTransactions} loading={loading} />
                    <div className="p-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {txHasGenerated
                          ? `Showing ${paginatedTransactions.length} of ${filteredTransactionCount} matching events (total ${totalTransactionsCount})`
                          : "Preparing transaction history..."}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!txHasGenerated || txPage <= 1) return;
                            setTxPage((prev) => Math.max(1, prev - 1));
                          }}
                          disabled={txPage <= 1 || !txHasGenerated || loading}
                          className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {txPage} of {filteredMaxPage}
                        </span>
                        <button
                          onClick={() => {
                            if (!txHasGenerated) return;
                            if (txPage >= filteredMaxPage) return;
                            setTxPage((prev) => Math.min(filteredMaxPage, prev + 1));
                          }}
                          disabled={!txHasGenerated || txPage >= filteredMaxPage || loading}
                          className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                        <label className="text-sm text-gray-600">Per page:</label>
                        <select
                          value={txPageSize}
                          onChange={(e) => {
                            const newSize = Number(e.target.value);
                            setTxPageSize(newSize);
                            setTxPage(1);
                          }}
                          className="rounded-md border-2 px-2 py-1 text-sm"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
{/* User Balances table removed */}
              {activeReport === "topItems" && <TopItemsReportTable data={reportData} loading={loading} />}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
