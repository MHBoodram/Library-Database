import { useState, useEffect, useCallback } from "react";
import { Field, Th, Td } from "./shared/CommonComponents";
import { formatLibraryDateTime, libraryDateTimeToUTCISOString } from "../../utils";

export default function ReservationsPanel({ api, staffUser, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ user_id: "", room_id: "", start_time: "", end_time: "" });
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);
  // Rooms management state
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomForm, setEditRoomForm] = useState({ room_number: "", capacity: "", features: "" });

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("staff/reservations");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchReservations();
    // also refresh rooms list
    (async () => {
      setRoomsLoading(true);
      setRoomsError("");
      try {
        const data = await api("rooms");
        setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        setRoomsError(err.message || "Failed to load rooms");
      } finally {
        setRoomsLoading(false);
      }
    })();
  }, [api, fetchReservations, refreshFlag]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitMessage("");
    try {
      const payload = {
        user_id: Number(form.user_id),
        room_id: Number(form.room_id),
        // Convert naive local datetime values to UTC ISO for consistent server handling
        start_time: libraryDateTimeToUTCISOString(form.start_time),
        end_time: libraryDateTimeToUTCISOString(form.end_time),
        employee_id: staffUser?.employee_id,
      };
      await api("staff/reservations", { method: "POST", body: payload });
      setSubmitMessage("Reservation created successfully.");
      setForm({ user_id: "", room_id: "", start_time: "", end_time: "" });
      setRefreshFlag((f) => f + 1);
      try { if (typeof onChanged === 'function') onChanged(); } catch { /* no-op */ }
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || err.message;
      if (code === "reservation_conflict") {
        setSubmitError(msg || "That room is already booked for the selected time.");
      } else if (code === "duration_exceeded") {
        setSubmitError(msg || "Reservations cannot exceed 2 hours.");
      } else if (code === "invalid_payload" || code === "invalid_timespan") {
        setSubmitError(msg || "Please check the form inputs.");
      } else if (code === "outside_library_hours") {
        setSubmitError(msg || "Reservation is outside library operating hours.");
      } else {
        setSubmitError(msg || "Failed to create reservation.");
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Create Room Reservation</h2>
        <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm">
          <strong>Library Hours:</strong>
          <div className="mt-1 text-blue-900">
            Mon-Fri: 7:00 AM - 10:00 PM | Sat: 9:00 AM - 8:00 PM | Sun: 10:00 AM - 6:00 PM
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Reservations must be within operating hours, cannot span multiple days, and are limited to a maximum of 2 hours.
          </div>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Patron ID">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.user_id}
              onChange={(e) => update("user_id", e.target.value)}
              placeholder="e.g., 15"
              required
            />
          </Field>
          <Field label="Room ID">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.room_id}
              onChange={(e) => update("room_id", e.target.value)}
              placeholder="e.g., 2"
              required
            />
          </Field>
          <Field label="Start Time">
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
              required
            />
          </Field>
          <Field label="End Time">
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
              required
            />
          </Field>
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-md btn-primary px-4 py-2 disabled:opacity-50">
              Create Reservation
            </button>
            {submitMessage && <span className="text-sm text-green-700">{submitMessage}</span>}
            {submitError && <span className="text-sm text-red-600">{submitError}</span>}
          </div>
        </form>
      </div>

      {/* Manage Rooms Section */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
          <span className="text-md font-semibold mb-2">Manage Rooms</span>
          <button
            onClick={() => setRefreshFlag((f) => f + 1)}
            className="text-xs font-medium text-gray-700 hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <Th>ID</Th>
                <Th>Room Number</Th>
                <Th>Capacity</Th>
                <Th>Features</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {roomsLoading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">Loading rooms…</td>
                </tr>
              ) : roomsError ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-red-600">{roomsError}</td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-600">No rooms yet.</td>
                </tr>
              ) : (
                rooms.map((r) => {
                  const isEditing = editingRoomId === r.room_id;
                  return (
                    <tr key={r.room_id} className="border-t">
                      <Td>#{r.room_id}</Td>
                      <Td>
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editRoomForm.room_number}
                            onChange={(e) => setEditRoomForm((p) => ({ ...p, room_number: e.target.value }))}
                          />
                        ) : (
                          r.room_number
                        )}
                      </Td>
                      <Td>
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            className="w-24 rounded-md border px-2 py-1"
                            value={editRoomForm.capacity ?? ""}
                            onChange={(e) => setEditRoomForm((p) => ({ ...p, capacity: e.target.value }))}
                          />
                        ) : (
                          r.capacity ?? "—"
                        )}
                      </Td>
                      <Td>
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editRoomForm.features ?? ""}
                            onChange={(e) => setEditRoomForm((p) => ({ ...p, features: e.target.value }))}
                          />
                        ) : (
                          r.features ?? "—"
                        )}
                      </Td>
                      <Td className="whitespace-nowrap space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                              onClick={async () => {
                                try {
                                  const payload = {
                                    room_number: editRoomForm.room_number,
                                    capacity: editRoomForm.capacity === "" ? null : Number(editRoomForm.capacity),
                                    features: editRoomForm.features === "" ? null : editRoomForm.features,
                                  };
                                  await api(`staff/rooms/${r.room_id}`, { method: 'PUT', body: payload });
                                  setEditingRoomId(null);
                                  setRefreshFlag((f) => f + 1);
                                } catch (err) {
                                  const code = err?.data?.error;
                                  const msg = err?.data?.message || err.message;
                                  if (code === 'room_exists') alert(msg || 'That room number already exists.');
                                  else alert(msg || 'Failed to update room');
                                }
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                              onClick={() => setEditingRoomId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => {
                                setEditingRoomId(r.room_id);
                                setEditRoomForm({
                                  room_number: r.room_number || "",
                                  capacity: r.capacity ?? "",
                                  features: r.features ?? "",
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                              onClick={async () => {
                                if (!window.confirm(`Permanently delete room ${r.room_number || r.room_id}?`)) return;
                                try {
                                  await api(`staff/rooms/${r.room_id}`, { method: 'DELETE' });
                                  setRefreshFlag((f) => f + 1);
                                } catch (err) {
                                  const code = err?.data?.error;
                                  const msg = err?.data?.message || err.message;
                                  if (code === 'room_in_use') alert(msg || 'Room has reservations and cannot be deleted.');
                                  else alert(msg || 'Failed to delete room');
                                }
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
          <span className="font-medium text-gray-700">Upcoming Reservations</span>
          <button
            onClick={() => setRefreshFlag((f) => f + 1)}
            className="text-xs font-medium text-gray-700 hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <Th>ID</Th>
                <Th>Room</Th>
                <Th>Patron</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">Loading reservations…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-red-600">{error}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-600">No reservations yet.</td>
                </tr>
              ) : (
                rows.map((r) => {
                  const displayStatus = r.computed_status || r.status;
                  return (
                    <tr key={r.reservation_id} className="border-t">
                      <Td>#{r.reservation_id}</Td>
                      <Td>Room {r.room_number || r.room_id}</Td>
                      <Td>
                        {r.first_name} {r.last_name}
                      </Td>
                      <Td>{formatLibraryDateTime(r.start_time)}</Td>
                      <Td>{formatLibraryDateTime(r.end_time)}</Td>
                      <Td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            displayStatus === 'completed' || displayStatus === 'cancelled'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </Td>
                      <Td>
                        {displayStatus === 'active' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Cancel reservation #${r.reservation_id}?`)) return;
                              try {
                                await api(`reservations/${r.reservation_id}/cancel`, { method: 'PATCH' });
                                setRefreshFlag((f) => f + 1);
                                try { if (typeof onChanged === 'function') onChanged(); } catch { /* no-op */ }
                              } catch (err) {
                                console.error("Cancel error:", err);
                                const errCode = err.data?.error || err.error;
                                const errMsg = err.data?.message || err.message || 'Unknown error';
                                alert(`Failed to cancel (${errCode}): ${errMsg}`);
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                          >
                            Cancel
                          </button>
                        )}
                        {' '}
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Permanently delete reservation #${r.reservation_id}?`)) return;
                            try {
                              await api(`staff/reservations/${r.reservation_id}`, { method: 'DELETE' });
                              setRefreshFlag((f) => f + 1);
                              try { if (typeof onChanged === 'function') onChanged(); } catch { /* no-op */ }
                            } catch (err) {
                              console.error("Delete error:", err);
                              const errCode = err.data?.error || err.error;
                              const errMsg = err.data?.message || err.message || 'Unknown error';
                              alert(`Failed to delete (${errCode}): ${errMsg}`);
                            }
                          }}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
