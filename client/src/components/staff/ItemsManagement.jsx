import { useState, useEffect, useCallback } from "react";
import { Field, Th, Td } from "./shared/CommonComponents";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// ============================================================================
// AddItemPanel
// ============================================================================

export function AddItemPanel() {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    cover_image_url: "",
    item_type: "book",
    isbn: "",
    publisher: "",
    publication_year: "",
    model: "",
    manufacturer: "",
    media_type: "DVD",
    length_minutes: "",
    release_year: "",
    number_of_copies: "1",
    shelf_location_same: "yes",
    shelf_location: "",
  });

  const [authors, setAuthors] = useState([{ name: "" }]);
  const [copies, setCopies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateAuthor(index, value) {
    setAuthors((list) =>
      list.map((author, i) => (i === index ? { name: value } : author))
    );
  }

  function addAuthorRow() {
    setAuthors((list) => [...list, { name: "" }]);
  }

  function removeAuthorRow(index) {
    setAuthors((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
  }

  function updateCopyShelf(index, value) {
    setCopies((list) =>
      list.map((copy, i) => (i === index ? { ...copy, shelf_location: value } : copy))
    );
  }

  function updateCopyBarcode(index, value) {
    setCopies((list) =>
      list.map((copy, i) => (i === index ? { ...copy, barcode: value } : copy))
    );
  }

  useEffect(() => {
    const count = parseInt(form.number_of_copies, 10) || 0;
    setCopies((prev) => {
      if (count === prev.length) return prev;
      if (count < prev.length) return prev.slice(0, count);
      const newOnes = Array.from({ length: count - prev.length }, () => ({
        barcode: "",
        shelf_location: "",
      }));
      return [...prev, ...newOnes];
    });
  }, [form.number_of_copies]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const title = form.title.trim();
      if (!title) {
        throw new Error("Title is required");
      }

      // Authors are now optional for all types (including books)

      const itemPayload = {
        title,
        subject: form.subject.trim() || null,
        description: form.description.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
        item_type: form.item_type,
      };

      if (form.item_type === "book") {
        if (form.isbn.trim()) itemPayload.isbn = form.isbn.trim();
        if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
        if (form.publication_year) itemPayload.publication_year = Number(form.publication_year);
      } else if (form.item_type === "device") {
        if (form.model.trim()) itemPayload.model = form.model.trim();
        if (form.manufacturer.trim()) itemPayload.manufacturer = form.manufacturer.trim();
      } else if (form.item_type === "media") {
        if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
        if (form.release_year) itemPayload.publication_year = Number(form.release_year);
        if (form.length_minutes) itemPayload.length_minutes = Number(form.length_minutes);
        if (form.media_type) itemPayload.media_type = form.media_type;
      }

      const createRes = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemPayload),
        credentials: "include",
      });

      let json;
      try {
        json = await createRes.json();
      } catch {
        json = null;
      }

      if (!createRes.ok) {
        const errMsg = json?.message || json?.error || `Server returned ${createRes.status}`;
        throw new Error(errMsg);
      }

      const newItemId = json.item_id;

      // Add authors if book
      if (form.item_type === "book") {
        const authorNames = authors.map((a) => a.name.trim()).filter(Boolean);
        for (const authorName of authorNames) {
          const authorRes = await fetch(`${API_BASE}/authors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id: newItemId, author_name: authorName }),
            credentials: "include",
          });
          if (!authorRes.ok) {
            const authorErr = await authorRes.json().catch(() => ({}));
            console.warn("Author creation failed:", authorErr);
          }
        }
      }

      // Create copies
      const finalShelf = form.shelf_location_same === "yes" ? form.shelf_location.trim() : "";
      for (let i = 0; i < copies.length; i++) {
        const copy = copies[i];
        const barcodeVal = copy.barcode.trim() || undefined;
        const locationVal =
          form.shelf_location_same === "yes"
            ? finalShelf || undefined
            : copy.shelf_location.trim() || undefined;

        const copyPayload = { item_id: newItemId };
        if (barcodeVal) copyPayload.barcode = barcodeVal;
        if (locationVal) copyPayload.shelf_location = locationVal;

        const copyRes = await fetch(`${API_BASE}/copies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(copyPayload),
          credentials: "include",
        });
        if (!copyRes.ok) {
          const copyErr = await copyRes.json().catch(() => ({}));
          console.warn("Copy creation failed:", copyErr);
        }
      }

      setMessage(`✓ Item "${title}" added with ${copies.length} ${copies.length === 1 ? "copy" : "copies"}.`);
      setForm({
        title: "",
        subject: "",
        description: "",
        cover_image_url: "",
        item_type: "book",
        isbn: "",
        publisher: "",
        publication_year: "",
        model: "",
        manufacturer: "",
        media_type: "DVD",
        length_minutes: "",
        release_year: "",
        number_of_copies: "1",
        shelf_location_same: "yes",
        shelf_location: "",
      });
      setAuthors([{ name: "" }]);
      setCopies([{ barcode: "", shelf_location: "" }]);
    } catch (err) {
      const msg = err?.data?.message || err.message || "Failed to create item";
      setMessage(`Failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </Field>

          <Field label="Subject">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="e.g., Literature"
            />
          </Field>

          <Field label="Description">
            <textarea
              className="w-full rounded-md border px-3 py-2"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Enter a description of this item..."
              rows="4"
            />
          </Field>

          <Field label="Cover Image URL">
            <input
              type="url"
              className="w-full rounded-md border px-3 py-2"
              value={form.cover_image_url}
              onChange={(e) => update("cover_image_url", e.target.value)}
              placeholder="e.g., https://example.com/cover.jpg"
            />
            <small className="text-xs text-gray-500 mt-1 block">
              Leave blank to use ISBN lookup or default placeholder
            </small>
          </Field>

          <Field label="Item Type">
            <select
              className="w-full rounded-md border px-3 py-2"
              value={form.item_type}
              onChange={(e) => update("item_type", e.target.value)}
            >
              <option value="general">General</option>
              <option value="book">Book</option>
              <option value="device">Device</option>
              <option value="media">Media</option>
            </select>
          </Field>

          {form.item_type === "book" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="ISBN">
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={form.isbn}
                    onChange={(e) => update("isbn", e.target.value)}
                    placeholder="e.g., 9780142407332"
                  />
                </Field>
                <Field label="Publisher">
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={form.publisher}
                    onChange={(e) => update("publisher", e.target.value)}
                    placeholder="e.g., Penguin"
                  />
                </Field>
                <Field label="Publication Year">
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border px-3 py-2"
                    value={form.publication_year}
                    onChange={(e) => update("publication_year", e.target.value)}
                    placeholder="e.g., 2006"
                  />
                </Field>
              </div>

              {/* Authors section for books */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-gray-700">Authors</h3>
                <p className="text-xs text-gray-500">Add one or more authors. Leave blank if unknown.</p>

                {authors.map((author, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3 items-end"
                  >
                    <Field label={`Author ${authors.length > 1 ? `#${index + 1}` : ""}`}>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        value={author.name}
                        onChange={(e) => updateAuthor(index, e.target.value)}
                        placeholder="e.g., F. Scott Fitzgerald"
                      />
                    </Field>
                    <div className="pb-2">
                      {authors.length > 1 && (
                        <button
                          type="button"
                          className="mt-6 text-xs text-red-600 hover:underline"
                          onClick={() => removeAuthorRow(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="text-xs font-medium text-gray-700 hover:underline"
                  onClick={addAuthorRow}
                >
                  + Add another author
                </button>
              </div>
            </>
          )}

          {form.item_type === "device" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Model">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.model}
                  onChange={(e) => update("model", e.target.value)}
                  placeholder="e.g., iPad Pro"
                />
              </Field>
              <Field label="Manufacturer">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.manufacturer}
                  onChange={(e) => update("manufacturer", e.target.value)}
                  placeholder="e.g., Apple"
                />
              </Field>
            </div>
          )}

          {form.item_type === "media" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Media Type">
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={form.media_type}
                  onChange={(e) => update("media_type", e.target.value)}
                >
                  <option value="DVD">DVD</option>
                  <option value="CD">CD</option>
                  <option value="Blu-ray">Blu-ray</option>
                  <option value="VHS">VHS</option>
                </select>
              </Field>
              <Field label="Length (minutes)">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border px-3 py-2"
                  value={form.length_minutes}
                  onChange={(e) => update("length_minutes", e.target.value)}
                  placeholder="e.g., 120"
                />
              </Field>
              <Field label="Publisher">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.publisher}
                  onChange={(e) => update("publisher", e.target.value)}
                  placeholder="e.g., Warner Bros"
                />
              </Field>
              <Field label="Release Year">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border px-3 py-2"
                  value={form.release_year}
                  onChange={(e) => update("release_year", e.target.value)}
                  placeholder="e.g., 2020"
                />
              </Field>
            </div>
          )}

          <Field label="Number of Copies" helper="How many copies to create initially?">
            <input
              type="number"
              min="1"
              value={form.number_of_copies}
              onChange={(e) => update("number_of_copies", e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </Field>

          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-semibold text-gray-700">Shelf Location</h3>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="shelf_location_same"
                  value="yes"
                  checked={form.shelf_location_same === "yes"}
                  onChange={(e) => update("shelf_location_same", e.target.value)}
                  className="mr-2"
                />
                Same for all copies
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="shelf_location_same"
                  value="no"
                  checked={form.shelf_location_same === "no"}
                  onChange={(e) => update("shelf_location_same", e.target.value)}
                  className="mr-2"
                />
                Individual locations
              </label>
            </div>

            {form.shelf_location_same === "yes" ? (
              <Field label="Shelf Location for All Copies">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.shelf_location}
                  onChange={(e) => update("shelf_location", e.target.value)}
                  placeholder="e.g., Shelf A-5"
                />
              </Field>
            ) : (
              <div className="space-y-2">
                {copies.map((copy, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label={`Copy ${index + 1} – Barcode (optional)`}>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        value={copy.barcode}
                        onChange={(e) => updateCopyBarcode(index, e.target.value)}
                        placeholder="Leave blank to auto-generate"
                      />
                    </Field>
                    <Field label={`Copy ${index + 1} – Shelf Location`}>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        value={copy.shelf_location}
                        onChange={(e) => updateCopyShelf(index, e.target.value)}
                        placeholder="e.g., Shelf A-5"
                      />
                    </Field>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md btn-primary px-4 py-2 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Item"}
            </button>
            {message && (
              <p
                className={`text-sm ${
                  message.startsWith("Failed") ? "text-red-600" : "text-green-700"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

// ============================================================================
// EditItemPanel
// ============================================================================

export function EditItemPanel({ api }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [existingAuthors, setExistingAuthors] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    cover_image_url: "",
    item_type: "book",
    isbn: "",
    publisher: "",
    publication_year: "",
    model: "",
    manufacturer: "",
    media_type: "DVD",
    length_minutes: "",
    additional_copies: "0",
    bulk_shelf_location: "",
  });
  const [authors, setAuthors] = useState([{ name: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [existingCopies, setExistingCopies] = useState([]);
  const [loadingCopies, setLoadingCopies] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search items
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setItems([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await api(`items?q=${encodeURIComponent(debouncedQuery)}`);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Search error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQuery, api]);

  async function selectItem(item) {
    setSelectedItem(item);
    setForm({
      title: item.title || "",
      subject: item.subject || "",
      description: item.description || "",
      cover_image_url: item.cover_image_url || "",
      item_type: item.item_type || "book",
      isbn: item.isbn || "",
      publisher: item.publisher || "",
      publication_year: item.publication_year || "",
      model: item.model || "",
      manufacturer: item.manufacturer || "",
      media_type: item.media_type || "DVD",
      length_minutes: item.length_minutes || "",
      additional_copies: "0",
      bulk_shelf_location: "",
    });

    // Fetch existing copies for this item
    setLoadingCopies(true);
    try {
      const copiesData = await api(`items/${item.item_id}/copies`);
      setExistingCopies(Array.isArray(copiesData) ? copiesData : []);
    } catch (err) {
      console.error("Error fetching copies:", err);
      setExistingCopies([]);
    } finally {
      setLoadingCopies(false);
    }

    // Fetch existing authors for this item
    if (item.item_type === "book") {
      try {
        const authorsData = await api(`items/${item.item_id}/authors`);
        if (authorsData && authorsData.length > 0) {
          setExistingAuthors(authorsData);
          setAuthors(authorsData.map((a) => ({ name: a.author_name || a.full_name })));
        } else {
          setExistingAuthors([]);
          setAuthors([{ name: "" }]);
        }
      } catch (err) {
        console.error("Error fetching authors:", err);
        setExistingAuthors([]);
        setAuthors([{ name: "" }]);
      }
    } else {
      setExistingAuthors([]);
      setAuthors([{ name: "" }]);
    }
    setMessage("");
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateAuthor(index, value) {
    setAuthors((list) => list.map((author, i) => (i === index ? { name: value } : author)));
  }

  function addAuthorRow() {
    setAuthors((list) => [...list, { name: "" }]);
  }

  function removeAuthorRow(index) {
    setAuthors((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    setMessage("");

    try {
      const title = form.title.trim();
      if (!title) {
        throw new Error("Title is required");
      }

      const itemPayload = {
        title,
        subject: form.subject.trim() || null,
        description: form.description.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
      };

      console.log("[EditItem] Updating item with payload:", itemPayload);

      if (form.item_type === "book") {
        if (form.isbn.trim()) itemPayload.isbn = form.isbn.trim();
        if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
        if (form.publication_year) itemPayload.publication_year = Number(form.publication_year);
      } else if (form.item_type === "device") {
        if (form.model.trim()) itemPayload.model = form.model.trim();
        if (form.manufacturer.trim()) itemPayload.manufacturer = form.manufacturer.trim();
      } else if (form.item_type === "media") {
        if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
        if (form.publication_year) itemPayload.publication_year = Number(form.publication_year);
        if (form.length_minutes) itemPayload.length_minutes = Number(form.length_minutes);
        if (form.media_type) itemPayload.media_type = form.media_type;
      }

      // Update item
      console.log("[EditItem] Sending PUT request to items/" + selectedItem.item_id);
      const updateResult = await api(`items/${selectedItem.item_id}`, {
        method: "PUT",
        body: itemPayload,
      });
      console.log("[EditItem] Update result:", updateResult);

      // Update authors if book
      if (form.item_type === "book") {
        // Delete existing authors
        for (const existingAuthor of existingAuthors) {
          try {
            await api(`items/${selectedItem.item_id}/authors/${existingAuthor.author_id}`, {
              method: "DELETE",
            });
          } catch (err) {
            console.error("Error deleting author:", err);
          }
        }

        // Add new authors
        const authorNames = authors.map((a) => a.name.trim()).filter(Boolean);
        for (const authorName of authorNames) {
          try {
            await api("authors", {
              method: "POST",
              body: { item_id: selectedItem.item_id, author_name: authorName },
            });
          } catch (err) {
            console.error("Error adding author:", err);
          }
        }
      }

      // Add additional copies if requested
      const additionalCopies = parseInt(form.additional_copies, 10) || 0;
      let createdCopies = 0;
      if (additionalCopies > 0) {
        for (let i = 0; i < additionalCopies; i++) {
          try {
            await api("copies", {
              method: "POST",
              body: { item_id: selectedItem.item_id },
            });
            createdCopies += 1;
          } catch (err) {
            console.error("Error creating copy:", err);
            break;
          }
        }
      }

      setMessage(
        `✓ Item "${title}" updated successfully${createdCopies > 0 ? ` and ${createdCopies} ${createdCopies === 1 ? "copy" : "copies"} added` : ""}.`
      );
      setSelectedItem(null);
      setSearchQuery("");
      setItems([]);
    } catch (err) {
      const msg = err?.data?.message || err.message || "Failed to update item";
      setMessage(`Failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      {!selectedItem ? (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Edit Item</h2>
          <p className="text-sm text-gray-600 mb-4">
            Search for an item by title, ISBN, or ID to edit its details.
          </p>

          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 mb-4"
            placeholder="Search by title, ISBN, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {loading && <div className="text-sm text-gray-600">Searching...</div>}

          {!loading && items.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.item_id} className="border-t">
                      <td className="p-3">#{item.item_id}</td>
                      <td className="p-3">{item.title}</td>
                      <td className="p-3 capitalize">{item.item_type || "general"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => selectItem(item)}
                          className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && debouncedQuery && items.length === 0 && (
            <div className="text-sm text-gray-600">No items found.</div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Item: {selectedItem.title}</h2>
            <button
              onClick={() => {
                setSelectedItem(null);
                setSearchQuery("");
                setMessage("");
              }}
              className="text-sm text-gray-600 hover:underline"
            >
              ← Back to search
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
              />
            </Field>

            <Field label="Subject">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="e.g., Literature"
              />
            </Field>

            <Field label="Description">
              <textarea
                className="w-full rounded-md border px-3 py-2"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Enter a description of this item..."
                rows="4"
              />
            </Field>

            <Field label="Cover Image URL">
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2"
                value={form.cover_image_url}
                onChange={(e) => update("cover_image_url", e.target.value)}
                placeholder="e.g., https://example.com/cover.jpg"
              />
              <small className="text-xs text-gray-500 mt-1 block">
                Leave blank to use ISBN lookup or default placeholder
              </small>
            </Field>

            <Field label="Item Type">
              <select
                className="w-full rounded-md border px-3 py-2"
                value={form.item_type}
                onChange={(e) => update("item_type", e.target.value)}
              >
                <option value="general">General</option>
                <option value="book">Book</option>
                <option value="device">Device</option>
                <option value="media">Media</option>
              </select>
            </Field>

            {form.item_type === "book" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="ISBN">
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={form.isbn}
                      onChange={(e) => update("isbn", e.target.value)}
                      placeholder="e.g., 9780142407332"
                    />
                  </Field>
                  <Field label="Publisher">
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={form.publisher}
                      onChange={(e) => update("publisher", e.target.value)}
                      placeholder="e.g., Penguin"
                    />
                  </Field>
                  <Field label="Publication Year">
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-md border px-3 py-2"
                      value={form.publication_year}
                      onChange={(e) => update("publication_year", e.target.value)}
                      placeholder="e.g., 2006"
                    />
                  </Field>
                </div>

                {/* Authors section for books */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-semibold text-gray-700">Authors</h3>
                  <p className="text-xs text-gray-500">
                    Add one or more authors. Leave blank if unknown.
                  </p>

                  {authors.map((author, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3 items-end"
                    >
                      <Field label={`Author ${authors.length > 1 ? `#${index + 1}` : ""}`}>
                        <input
                          className="w-full rounded-md border px-3 py-2"
                          value={author.name}
                          onChange={(e) => updateAuthor(index, e.target.value)}
                          placeholder="e.g., F. Scott Fitzgerald"
                        />
                      </Field>
                      <div className="pb-2">
                        {authors.length > 1 && (
                          <button
                            type="button"
                            className="mt-6 text-xs text-red-600 hover:underline"
                            onClick={() => removeAuthorRow(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="text-xs font-medium text-gray-700 hover:underline"
                    onClick={addAuthorRow}
                  >
                    + Add another author
                  </button>
                </div>
              </>
            )}

            {form.item_type === "device" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Model">
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={form.model}
                    onChange={(e) => update("model", e.target.value)}
                    placeholder="e.g., iPad Pro"
                  />
                </Field>
                <Field label="Manufacturer">
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={form.manufacturer}
                    onChange={(e) => update("manufacturer", e.target.value)}
                    placeholder="e.g., Apple"
                  />
                </Field>
              </div>
            )}

            {form.item_type === "media" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Media Type">
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={form.media_type}
                    onChange={(e) => update("media_type", e.target.value)}
                  >
                    <option value="DVD">DVD</option>
                    <option value="CD">CD</option>
                    <option value="Blu-ray">Blu-ray</option>
                    <option value="VHS">VHS</option>
                  </select>
                </Field>
                <Field label="Length (minutes)">
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border px-3 py-2"
                    value={form.length_minutes}
                    onChange={(e) => update("length_minutes", e.target.value)}
                    placeholder="e.g., 120"
                  />
                </Field>
                <Field label="Publisher">
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={form.publisher}
                    onChange={(e) => update("publisher", e.target.value)}
                    placeholder="e.g., Warner Bros"
                  />
                </Field>
                <Field label="Publication Year">
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border px-3 py-2"
                    value={form.publication_year}
                    onChange={(e) => update("publication_year", e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </Field>
              </div>
            )}

            {/* Existing Copies Management */}
            {selectedItem && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Active Copies ({existingCopies.filter((c) => c.status !== "lost").length})
                </h3>
                {loadingCopies ? (
                  <p className="text-sm text-gray-500">Loading copies...</p>
                ) : existingCopies.filter((c) => c.status !== "lost").length === 0 ? (
                  <p className="text-sm text-gray-500">No active copies found for this item.</p>
                ) : (
                  <div className="space-y-2">
                    {existingCopies
                      .filter((c) => c.status !== "lost")
                      .map((copy) => (
                        <CopyRow
                          key={copy.copy_id}
                          copy={copy}
                          api={api}
                          onUpdate={() => selectItem(selectedItem)}
                          onDelete={async () => {
                            const confirmed = window.confirm(
                              `Are you sure you want to delete copy ${copy.barcode}?\n\n` +
                                `This will permanently remove the copy if it has no loan history, ` +
                                `or mark it as "lost" if it has been loaned before.`
                            );
                            if (!confirmed) return;

                            try {
                              const result = await api(`copies/${copy.copy_id}`, {
                                method: "DELETE",
                              });
                              await selectItem(selectedItem);
                              if (result?.marked_lost) {
                                setMessage(
                                  `✓ Copy ${copy.barcode} marked as lost (has loan history).`
                                );
                              } else {
                                setMessage(`✓ Copy ${copy.barcode} deleted successfully.`);
                              }
                            } catch (err) {
                              setMessage(
                                `Failed to delete copy: ${err?.data?.error || err?.message || "Unknown error"}`
                              );
                            }
                          }}
                        />
                      ))}
                  </div>
                )}

                {/* Lost Copies Section */}
                {existingCopies.filter((c) => c.status === "lost").length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Lost Copies ({existingCopies.filter((c) => c.status === "lost").length})
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      These copies are marked as lost. You can permanently remove them from the
                      database.
                    </p>
                    <div className="space-y-2">
                      {existingCopies
                        .filter((c) => c.status === "lost")
                        .map((copy) => (
                          <div
                            key={copy.copy_id}
                            className="flex items-center gap-3 p-3 border rounded bg-red-50 border-red-200"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Barcode:</span>{" "}
                                <span className="text-gray-900">{copy.barcode}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Status:</span>{" "}
                                <span className="text-red-700 font-semibold">LOST</span>
                              </div>
                              <div className="col-span-2">
                                <span className="font-medium text-gray-700">Location:</span>{" "}
                                <span className="text-gray-900">{copy.shelf_location || "—"}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Permanently delete lost copy ${copy.barcode}?\n\n` +
                                    `This action cannot be undone. The copy will be removed from the database ` +
                                    `but loan history will be preserved.`
                                );
                                if (!confirmed) return;

                                try {
                                  await api(`copies/${copy.copy_id}?permanent=true`, {
                                    method: "DELETE",
                                  });
                                  await selectItem(selectedItem);
                                  setMessage(`✓ Lost copy ${copy.barcode} permanently deleted.`);
                                } catch (err) {
                                  setMessage(
                                    `Failed to delete copy: ${err?.data?.message || err?.message || "Unknown error"}`
                                  );
                                }
                              }}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                            >
                              Permanently Delete
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Shelf Update */}
            {selectedItem && existingCopies.filter((c) => c.status !== "lost").length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-gray-800">Bulk Shelf Update</h3>
                <p className="text-xs text-gray-500">
                  Set a new shelf location for all active copies below.
                </p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Field label="New Shelf Location">
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        value={form.bulk_shelf_location}
                        onChange={(e) => update("bulk_shelf_location", e.target.value)}
                        placeholder="e.g., Shelf B-4"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    disabled={!form.bulk_shelf_location.trim() || submitting}
                    onClick={async () => {
                      const shelf = form.bulk_shelf_location.trim();
                      if (!shelf) return;
                      const activeCopies = existingCopies.filter((c) => c.status !== "lost");
                      let updated = 0;
                      for (const copy of activeCopies) {
                        try {
                          await api(`copies/${copy.copy_id}`, {
                            method: "PUT",
                            body: { shelf_location: shelf },
                          });
                          updated++;
                        } catch (err) {
                          console.error("Bulk shelf update error:", err);
                        }
                      }
                      await selectItem(selectedItem); // refresh copies
                      setMessage(
                        `✓ Updated shelf for ${updated} active ${updated === 1 ? "copy" : "copies"}.`
                      );
                      update("bulk_shelf_location", "");
                    }}
                    className="h-[42px] px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
                  >
                    Apply to All
                  </button>
                </div>
              </div>
            )}

            {/* Additional Copies */}
            <Field
              label="Add Additional Copies"
              helper="Number of new copies to create (leave 0 to not add any)"
            >
              <input
                type="number"
                min="0"
                value={form.additional_copies}
                onChange={(e) => setForm((f) => ({ ...f, additional_copies: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md btn-primary px-4 py-2 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Update Item"}
              </button>
              {message && (
                <p
                  className={`text-sm ${
                    message.startsWith("Failed") ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function CopyRow({ copy, api, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [location, setLocation] = useState(copy.shelf_location || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api(`copies/${copy.copy_id}`, {
        method: "PUT",
        body: { shelf_location: location.trim() || null },
      });
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(`Failed to update location: ${err?.data?.error || err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded bg-gray-50">
      <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">Barcode:</span>{" "}
          <span className="text-gray-900">{copy.barcode}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Status:</span>{" "}
          <span className="text-gray-900 capitalize">{copy.status}</span>
        </div>
        <div className="col-span-2">
          <span className="font-medium text-gray-700">Location:</span>{" "}
          {editing ? (
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="ml-2 px-2 py-1 border rounded text-sm"
              placeholder="e.g., Shelf A-12"
            />
          ) : (
            <span className="text-gray-900">{copy.shelf_location || "—"}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setLocation(copy.shelf_location || "");
                setEditing(false);
              }}
              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Location
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// RemoveItemPanel
// ============================================================================

export function RemoveItemPanel({ api }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState({});

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const searchItems = useCallback(
    async (signal) => {
      if (!api || !debouncedQuery) {
        setItems([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: debouncedQuery, pageSize: "50" });
        const data = await api(`items?${params.toString()}`, { signal });
        const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
        setItems(list);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err.message || "Failed to search items");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [api, debouncedQuery]
  );

  useEffect(() => {
    const controller = new AbortController();
    searchItems(controller.signal);
    return () => controller.abort();
  }, [searchItems]);

  async function handleDelete(itemId, title) {
    const confirmed = window.confirm(
      `Are you sure you want to delete:\n\n"${title}" (ID: ${itemId})?\n\nThis action cannot be undone and will also delete all copies and related data.`
    );
    if (!confirmed) return;

    setDeleteStatus((prev) => ({ ...prev, [itemId]: "deleting" }));
    try {
      const result = await api(`items/${itemId}`, { method: "DELETE" });
      setDeleteStatus((prev) => ({ ...prev, [itemId]: "success" }));
      setItems((prev) => prev.filter((item) => item.item_id !== itemId));

      // Show success message
      const successMsg = result?.message || "Item deleted successfully";
      alert(`✓ ${successMsg}`);

      setTimeout(() => {
        setDeleteStatus((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 2000);
    } catch (err) {
      setDeleteStatus((prev) => ({ ...prev, [itemId]: "error" }));

      // Extract detailed error message
      const errorCode = err?.data?.error || err?.error;
      const errorMessage = err?.data?.message || err?.message;

      let userMessage = "Failed to delete item";
      if (errorCode === "has_active_loans") {
        userMessage = `❌ Cannot delete: ${errorMessage}`;
      } else if (errorCode === "not_found") {
        userMessage = "❌ Item not found. It may have already been deleted.";
      } else if (errorMessage) {
        userMessage = `❌ ${errorMessage}`;
      } else {
        userMessage = `❌ Failed to delete item: ${errorCode || "Unknown error"}`;
      }

      alert(userMessage);
      setTimeout(() => {
        setDeleteStatus((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 3000);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-3">Remove Item</h2>
        <p className="text-sm text-gray-600 mb-4">Search for items by title, ISBN, or ID.</p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search Items</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter title, ISBN, or item ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 mb-4">{error}</div>
        )}
      </div>

      {debouncedQuery && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
            <span className="font-medium text-gray-700">
              {loading ? "Searching..." : `Found ${items.length} item(s)`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <Th>ID</Th>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>ISBN</Th>
                  <Th>Subject</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-center" colSpan={6}>
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-gray-600" colSpan={6}>
                      No items found matching "{debouncedQuery}"
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const status = deleteStatus[item.item_id];
                    return (
                      <tr key={item.item_id} className="border-t">
                        <Td>#{item.item_id}</Td>
                        <Td className="max-w-[30ch] truncate" title={item.title}>
                          {item.title}
                        </Td>
                        <Td className="capitalize">{item.item_type || "—"}</Td>
                        <Td>{item.isbn || "—"}</Td>
                        <Td>{item.subject || "—"}</Td>
                        <Td>
                          {status === "success" ? (
                            <span className="text-green-600 text-xs font-medium">✓ Deleted</span>
                          ) : status === "error" ? (
                            <span className="text-red-600 text-xs font-medium">✗ Error</span>
                          ) : (
                            <button
                              onClick={() => handleDelete(item.item_id, item.title)}
                              disabled={status === "deleting"}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {status === "deleting" ? "Deleting..." : "Delete"}
                            </button>
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
      )}
    </section>
  );
}
