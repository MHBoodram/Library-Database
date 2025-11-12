import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatLibraryDateTime, toLibraryDateISOString, toLibraryTimeParts } from "../utils";
import "./Rooms.css";

function RoomCalendarViewPatron({ api, onReservationCreated }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterCapacity, setFilterCapacity] = useState("");
  const [filterFeatures, setFilterFeatures] = useState("");

  // Fetch room availability for selected date
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError("");
      try {
  const data = await api(`reservations/availability?date=${selectedDate}`);
        setRooms(data.rooms || []);
      } catch (err) {
        setError(err.message || "Failed to load room availability");
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [api, selectedDate]);

  // Navigation helpers
  const changeDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    if (filterCapacity && room.capacity < Number(filterCapacity)) return false;
    if (filterFeatures && !(room.features || "").toLowerCase().includes(filterFeatures.toLowerCase())) return false;
    return true;
  });

  // Generate time slots based on library operation hours for the selected date
  const timeSlots = [];
  const dateObj = new Date(selectedDate);
  const dayOfWeek = dateObj.getDay();
  
  let startHour, endHour;
  
  // Monday - Friday: 7:00 AM - 6:00 PM
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    startHour = 7;
    endHour = 18;
  }
  // Saturday: 9:00 AM - 6:00 PM
  else if (dayOfWeek === 6) {
    startHour = 9;
    endHour = 18;
  }
  // Sunday: 10:00 AM - 6:00 PM
  else if (dayOfWeek === 0) {
    startHour = 10;
    endHour = 18;
  }
  
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push(hour);
  }

  function slotRangeParts(hour) {
    const startStr = `${selectedDate}T${String(hour).padStart(2, "0")}:00:00`;
    const endStr = `${selectedDate}T${String(hour + 1).padStart(2, "0")}:00:00`;
    return {
      start: toLibraryTimeParts(startStr),
      end: toLibraryTimeParts(endStr),
    };
  }

  function compareParts(a, b) {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    if (a.day !== b.day) return a.day - b.day;
    if (a.hour !== b.hour) return a.hour - b.hour;
    if (a.minute !== b.minute) return a.minute - b.minute;
    return a.second - b.second;
  }

  function overlapsSlot(reservation, slotStart, slotEnd) {
    const resStart = toLibraryTimeParts(reservation.start_time);
    const resEnd = toLibraryTimeParts(reservation.end_time);
    if (!resStart || !resEnd || !slotStart || !slotEnd) return false;
    const startsBeforeSlotEnds = compareParts(resStart, slotEnd) < 0;
    const endsAfterSlotStarts = compareParts(resEnd, slotStart) > 0;
    return startsBeforeSlotEnds && endsAfterSlotStarts;
  }

  // Check if a time slot is reserved
  const isReserved = (reservations, hour) => {
    const { start, end } = slotRangeParts(hour);
    return reservations.some((res) => overlapsSlot(res, start, end));
  };

  // Check if reservation belongs to current user
  const isMine = (reservations, hour) => {
    const { start, end } = slotRangeParts(hour);
    return reservations.some((res) => res.is_mine && overlapsSlot(res, start, end));
  };

  // Check if time slot is in the past or outside operation hours
  const isSlotBookable = (hour) => {
    const nowParts = toLibraryTimeParts(new Date());
    const slotParts = toLibraryTimeParts(`${selectedDate}T${String(hour).padStart(2, "0")}:00:00`);
    if (!nowParts || !slotParts) return false;

    const slotKey = `${slotParts.year}-${slotParts.month}-${slotParts.day}`;
    const nowKey = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
    if (slotKey < nowKey) return false;
    if (slotKey === nowKey && slotParts.hour <= nowParts.hour) return false;

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();
    
    // Check library operation hours
    // Monday - Friday: 7:00 AM - 6:00 PM
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (hour < 7 || hour > 18) {
        return false;
      }
    }
    // Saturday: 9:00 AM - 6:00 PM
    else if (dayOfWeek === 6) {
      if (hour < 9 || hour > 18) {
        return false;
      }
    }
    // Sunday: 10:00 AM - 6:00 PM
    else if (dayOfWeek === 0) {
      if (hour < 10 || hour > 18) {
        return false;
      }
    }

    return true;
  };

  // Handle slot click for booking
  const handleSlotClick = async (room, hour) => {
    const endHour = hour + 1; // 1-hour booking
    const startTime = toLibraryDateISOString(`${selectedDate}T${String(hour).padStart(2, "0")}:00:00`);
    const endTime = toLibraryDateISOString(`${selectedDate}T${String(endHour).padStart(2, "0")}:00:00`);

    if (!confirm(`Book ${room.room_number} from ${hour}:00 to ${endHour}:00?`)) return;

    try {
      await api("reservations", {
        method: "POST",
        body: {
          room_id: room.room_id,
          start_time: startTime,
          end_time: endTime,
        },
      });
      alert("Reservation created successfully!");
      // Refresh availability
      const data = await api(`reservations/availability?date=${selectedDate}`);
      setRooms(data.rooms || []);
      if (onReservationCreated) onReservationCreated();
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || err.message;
      if (code === "reservation_conflict") {
        alert(msg || "Room already booked for that time.");
      } else if (code === "duration_exceeded") {
        alert(msg || "Reservation exceeds 2-hour limit.");
      } else if (code === "outside_library_hours") {
        alert(msg || "Outside library hours.");
      } else {
        alert(msg || "Failed to create reservation.");
      }
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">Room Availability Calendar</h2>
        
        {/* Date Navigation */}
        <div className="calendar-nav">
          <button 
            onClick={() => changeDate(-1)} 
            className="calendar-btn"
            disabled={selectedDate <= new Date().toISOString().split('T')[0]}
          >
            ← Previous Day
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="calendar-date-input"
          />
          <button onClick={() => changeDate(1)} className="calendar-btn">
            Next Day →
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="calendar-btn calendar-btn-primary"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="calendar-filters">
          <div className="filter-group">
            <label>Min Capacity</label>
            <input
              type="number"
              min="0"
              placeholder="Any"
              value={filterCapacity}
              onChange={(e) => setFilterCapacity(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Features</label>
            <input
              type="text"
              placeholder="Search..."
              value={filterFeatures}
              onChange={(e) => setFilterFeatures(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-body">
        {loading ? (
          <div className="calendar-loading">Loading availability...</div>
        ) : error ? (
          <div className="calendar-error">{error}</div>
        ) : filteredRooms.length === 0 ? (
          <div className="calendar-empty">No rooms available</div>
        ) : (
          <div className="calendar-grid">
            {/* Time header */}
            <div className="calendar-grid-header">
              <div className="calendar-cell-room-label">Room</div>
              {timeSlots.map(hour => (
                <div key={hour} className="calendar-cell-time">
                  {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                </div>
              ))}
            </div>

            {/* Room rows */}
            {filteredRooms.map(room => (
              <div key={room.room_id} className="calendar-grid-row">
                <div className="calendar-cell-room">
                  <div className="room-number">{room.room_number}</div>
                  {room.capacity && <div className="room-capacity">Cap: {room.capacity}</div>}
                </div>
                {timeSlots.map(hour => {
                  const reserved = isReserved(room.reservations, hour);
                  const mine = isMine(room.reservations, hour);
                  const bookable = isSlotBookable(hour);
                  const disabled = reserved || !bookable;
                  
                  return (
                    <button
                      key={hour}
                      onClick={() => !disabled && handleSlotClick(room, hour)}
                      className={`calendar-cell-slot ${
                        mine
                          ? 'slot-mine'
                          : reserved
                          ? 'slot-reserved'
                          : !bookable
                          ? 'slot-unavailable'
                          : 'slot-available'
                      }`}
                      disabled={disabled}
                      title={
                        mine 
                          ? 'Your reservation' 
                          : reserved 
                          ? 'Reserved' 
                          : !bookable 
                          ? 'Past time or outside library hours' 
                          : 'Click to book'
                      }
                    >
                      {mine ? '★' : reserved ? '✗' : !bookable ? '—' : '✓'}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="calendar-legend">
        <strong>Legend:</strong>{' '}
        <span className="legend-item legend-available">✓ Available</span>{' '}
        <span className="legend-item legend-reserved">✗ Reserved</span>{' '}
        <span className="legend-item legend-mine">★ Your Reservation</span>{' '}
        <span className="legend-item legend-unavailable">— Unavailable</span>{' '}
        | Click available slots to create 1-hour reservations
      </div>
    </div>
  );
}

export default function Rooms() {
  const { token, useApi: api } = useAuth();
  const navigate = useNavigate();

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
  }, [token, navigate]);

  // Fetch user's reservations
  useEffect(() => {
    if (!token) return;
    
    (async () => {
      setReservationsLoading(true);
      setReservationsError("");
      try {
  const data = await api("reservations/my");
        setMyReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        setReservationsError(err?.message || "Failed to load your reservations.");
      } finally {
        setReservationsLoading(false);
      }
    })();
  }, [token, api, refreshFlag]);

  async function cancelReservation(reservationId) {
    if (!confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
  await api(`reservations/${reservationId}/cancel`, { method: "PATCH" });
      alert("Reservation cancelled successfully.");
      setRefreshFlag((f) => f + 1); // Refresh reservations list
    } catch (err) {
      const msg = err?.data?.message || err?.message;
      alert(msg || "Failed to cancel reservation.");
    }
  }

  // Use shared util to format in the library's timezone for clarity
  function formatDateTime(dateStr) {
    return formatLibraryDateTime(dateStr);
  }

  return (
    <div className="rooms-page">
      <NavBar />
      <h1>Reserve a Study Room</h1>
      
      {/* Library Hours Info */}
      <div className="rooms-info-banner">
        <strong>Library Hours:</strong>
        <div className="hours">
          Monday-Friday: 7:00 AM - 10:00 PM<br />
          Saturday: 9:00 AM - 8:00 PM<br />
          Sunday: 10:00 AM - 6:00 PM
        </div>
        <div className="note">
          Note: Reservations must be within operating hours, cannot span multiple days, and are limited to a maximum of 2 hours.
        </div>
      </div>

      {/* Room Calendar Grid */}
  <RoomCalendarViewPatron api={api} onReservationCreated={() => setRefreshFlag((f) => f + 1)} />

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
