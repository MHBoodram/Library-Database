import TopBar from "../TopBar";
import { useEffect, useState } from "react";

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/overview", { credentials: "include" });
        if (res.ok) setStats(await res.json());
      } catch {}
    })();
  }, []);

  return (
    <div>
      <TopBar />
      <div style={{ padding: 24 }}>
        <h2>Staff dashboard</h2>
        {stats ? (
          <ul>
            <li>Total books: {stats.totalBooks}</li>
            <li>Books on loan: {stats.onLoan}</li>
            <li>Overdue: {stats.overdue}</li>
          </ul>
        ) : (
          <p>Loading…</p>
        )}
      </div>
    </div>
  );
}
