import { useEffect,useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import "./Rooms.css";

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

  return (
    <div className="rooms-page">
      <NavBar />
      <h1>Reserve a Study Room</h1>
      <p>Pick a room and choose a time window</p>
      <div className="rooms-info-banner">
        <strong>Library Hours:</strong>
        <div className="hours">
          Monday-Friday: 7:00 AM - 10:00 PM<br />
          Saturday: 9:00 AM - 8:00 PM<br />
          Sunday: 10:00 AM - 6:00 PM
        </div>
        <div className="note">
          Note: Reservations must be within operating hours and cannot span multiple days.
        </div>
      </div>

      {loading ? (
        <div className="rooms-loading">Loading…</div>
      ) : error ? (
        <div className="rooms-error">{error}</div>
      ) : (
        <form onSubmit={submit} className="rooms-form">
          <div className="rooms-form-field full-width">
            <label>Room</label>
            <select value={room_id} onChange={(e) => setRoomId(e.target.value)} required>
              <option value="" disabled>Select a room…</option>
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  {r.room_number} {r.capacity ? `(cap ${r.capacity})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="rooms-form-field">
            <label>Start</label>
            <input type="datetime-local" value={start_time} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div className="rooms-form-field">
            <label>End</label>
            <input type="datetime-local" value={end_time} onChange={(e) => setEnd(e.target.value)} required />
          </div>
          <div className="rooms-form-field full-width">
            <button type="submit" className="rooms-reserve-btn">Reserve</button>
            {message && <span className="rooms-form-message success">{message}</span>}
            {error && <span className="rooms-form-message error">{error}</span>}
          </div>
        </form>
      )}

      {/* My Reservations Section */}
      <div className="rooms-reservations-section">
        <h2>My Reservations</h2>
        <p>View and manage your room reservations.</p>

        {reservationsLoading ? (
          <div className="rooms-loading">Loading your reservations…</div>
        ) : reservationsError ? (
          <div className="rooms-error">{reservationsError}</div>
        ) : myReservations.length === 0 ? (
          <div className="rooms-empty-state">
            You have no reservations yet.
          </div>
        ) : (
          <div className="rooms-reservations-container">
            <table className="rooms-reservations-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myReservations.map((res) => (
                  <tr key={res.reservation_id}>
                    <td>Room {res.room_number || res.room_id}</td>
                    <td>{formatDateTime(res.start_time)}</td>
                    <td>{formatDateTime(res.end_time)}</td>
                    <td>
                      <span className={`rooms-status-badge ${res.computed_status || res.status}`}>
                        {res.computed_status || res.status}
                      </span>
                    </td>
                    <td>
                      {(res.computed_status || res.status) === "active" && (
                        <button
                          onClick={() => cancelReservation(res.reservation_id)}
                          className="rooms-cancel-btn"
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
