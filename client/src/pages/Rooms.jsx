import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";

export default function Rooms() {
  const { token, useApi } = useAuth();
  const apiWithAuth = useApi();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [room_id, setRoomId] = useState("");
  const [start_time, setStart] = useState("");
  const [end_time, setEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || err?.message;
      if (code === "reservation_conflict") {
        setError(msg || "That room is already booked for that time.");
      } else if (code === "invalid_timespan") {
        setError(msg || "End time must be after start time.");
      } else {
        setError(msg || "Failed to create reservation.");
      }
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 24 }}>
      <NavBar />
      <h1>Reserve a Study Room</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>Pick a room and choose a time window. Overlaps are prevented automatically.</p>

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
    </div>
  );
}
