import { useEffect,useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";

export default function Rooms() {
  const { token, useApi } = useAuth();
  const apiWithAuth = useMemo(()=>useApi(),[useApi]);
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [room_id, setRoomId] = useState("");
  const [start_time, setStart] = useState("");
  const [end_time, setEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // My reservations state
  const [myReservations, setMyReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const data = await apiWithAuth("rooms");
        setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Failed to load rooms.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, apiWithAuth, navigate]);

  // Fetch user's reservations
  useEffect(() => {
    if (!token) return;
    
    (async () => {
      setReservationsLoading(true);
      setReservationsError("");
      try {
        const data = await apiWithAuth("reservations/my");
        setMyReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        setReservationsError(err?.message || "Failed to load your reservations.");
      } finally {
        setReservationsLoading(false);
      }
    })();
  }, [token, apiWithAuth, refreshFlag]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiWithAuth("reservations", {
        method: "POST",
        body: { room_id: Number(room_id), start_time, end_time },
      });
      setMessage("Reservation created.");
      setRoomId("");
      setStart("");
      setEnd("");
      setRefreshFlag((f) => f + 1); // Refresh reservations list
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || err?.message;
      if (code === "reservation_conflict") {
        setError(msg || "That room is already booked for that time.");
      } else if (code === "invalid_timespan") {
        setError(msg || "End time must be after start time.");
      } else if (code === "outside_library_hours") {
        setError(msg || "Reservation is outside library operating hours.");
      } else {
        setError(msg || "Failed to create reservation.");
      }
    }
  }

  async function cancelReservation(reservationId) {
    if (!confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
      await apiWithAuth(`reservations/${reservationId}/cancel`, { method: "PATCH" });
      setMessage("Reservation cancelled successfully.");
      setRefreshFlag((f) => f + 1); // Refresh reservations list
    } catch (err) {
      const msg = err?.data?.message || err?.message;
      setError(msg || "Failed to cancel reservation.");
    }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  function getStatusBadgeStyle(status) {
    const baseStyle = {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 500,
    };

    if (status === "active") {
      return { ...baseStyle, backgroundColor: "#d1fae5", color: "#065f46" };
    }
    if (status === "completed") {
      return { ...baseStyle, backgroundColor: "#e5e7eb", color: "#374151" };
    }
    if (status === "cancelled") {
      return { ...baseStyle, backgroundColor: "#e5e7eb", color: "#374151" };
    }
    return baseStyle;
  }

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 24 }}>
      <NavBar />
      <h1>Reserve a Study Room</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>Pick a room and choose a time window</p>
      <div style={{ backgroundColor: "#eff6ff", padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
        <strong>Library Hours:</strong>
        <div style={{ marginTop: 4, color: "#1e40af" }}>
          Monday-Friday: 7:00 AM - 10:00 PM<br />
          Saturday: 9:00 AM - 8:00 PM<br />
          Sunday: 10:00 AM - 6:00 PM
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
          Note: Reservations must be within operating hours and cannot span multiple days.
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "#b91c1c" }}>{error}</div>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 12, alignItems: "end", gridTemplateColumns: "1fr 1fr", maxWidth: 720 }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Room</label>
            <select value={room_id} onChange={(e) => setRoomId(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }} required>
              <option value="" disabled>Select a room…</option>
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  {r.room_number} {r.capacity ? `(cap ${r.capacity})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Start</label>
            <input type="datetime-local" value={start_time} onChange={(e) => setStart(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>End</label>
            <input type="datetime-local" value={end_time} onChange={(e) => setEnd(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }} required />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, border: "1px solid #0b7", background: "#111", color: "#fff" }}>Reserve</button>
            {message && <span style={{ marginLeft: 12, color: "#065f46" }}>{message}</span>}
            {error && <span style={{ marginLeft: 12, color: "#b91c1c" }}>{error}</span>}
          </div>
        </form>
      )}

      {/* My Reservations Section */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>My Reservations</h2>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>View and manage your room reservations.</p>

        {reservationsLoading ? (
          <div>Loading your reservations…</div>
        ) : reservationsError ? (
          <div style={{ color: "#b91c1c" }}>{reservationsError}</div>
        ) : myReservations.length === 0 ? (
          <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, color: "#6b7280" }}>
            You have no reservations yet.
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 14 }}>
              <thead style={{ backgroundColor: "#f9fafb", textAlign: "left" }}>
                <tr>
                  <th style={{ padding: 12, fontWeight: 600 }}>Room</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>Start</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>End</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>Status</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myReservations.map((res) => (
                  <tr key={res.reservation_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: 12 }}>
                      Room {res.room_number || res.room_id}
                    </td>
                    <td style={{ padding: 12 }}>
                      {formatDateTime(res.start_time)}
                    </td>
                    <td style={{ padding: 12 }}>
                      {formatDateTime(res.end_time)}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={getStatusBadgeStyle(res.computed_status || res.status)}>
                        {res.computed_status || res.status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      {(res.computed_status || res.status) === "active" && (
                        <button
                          onClick={() => cancelReservation(res.reservation_id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 4,
                            border: "1px solid #fbbf24",
                            background: "#fef3c7",
                            color: "#92400e",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
