import TopBar from "../TopBar";
import { useEffect, useState } from "react";

export default function PatronDashboard() {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/patron/loans", { credentials: "include" });
        if (res.ok) setLoans(await res.json());
      } catch {}
    })();
  }, []);

  return (
    <div>
      <TopBar />
      <div style={{ padding: 24 }}>
        <h2>Patron dashboard</h2>
        <p>Your current loans:</p>
        <ul>
          {loans.map((b) => (
            <li key={b.id}>{b.title} — due {b.due_date}</li>
          ))}
          {loans.length === 0 && <li>No active loans</li>}
        </ul>
      </div>
    </div>
  );
}
