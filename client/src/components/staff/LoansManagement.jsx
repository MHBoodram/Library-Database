import React, { useState } from "react";
import { Field } from "./shared/CommonComponents";
import { formatDate } from "../../utils";

export function CheckoutPanel({ api, staffUser }) {
  const [patronQuery, setPatronQuery] = useState("");
  const [patronResults, setPatronResults] = useState([]);
  const [patronLoading, setPatronLoading] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState(null);

  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // eslint-disable-line no-unused-vars -- used in nested callbacks

  const [copyOptions, setCopyOptions] = useState([]);
  const [selectedCopy, setSelectedCopy] = useState(null);

  const [manualForm, setManualForm] = useState({ user_id: "", identifier_type: "copy_id", identifier_value: "" });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(""); // surfaced in UI below
  const [error, setError] = useState("");   // surfaced in UI below

  const canCheckout = Boolean(selectedPatron && selectedCopy && !submitting);

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const searchPatrons = async () => {
    if (!patronQuery.trim()) {
      setPatronResults([]);
      return;
    }
    resetMessages();
    setPatronLoading(true);
    try {
      const results = await api(`staff/patrons/search?q=${encodeURIComponent(patronQuery.trim())}`);
      setPatronResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to search patrons.");
    } finally {
      setPatronLoading(false);
    }
  };

  const searchItems = async () => {
    if (!itemQuery.trim()) {
      setItemResults([]);
      return;
    }
    resetMessages();
    setItemLoading(true);
    try {
      const results = await api(`items?q=${encodeURIComponent(itemQuery.trim())}`);
      setItemResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to search items.");
    } finally {
      setItemLoading(false);
    }
  };

  const loadCopies = async (itemId) => {
    setCopyOptions([]);
    setSelectedCopy(null);
    try {
      const copies = await api(`items/${itemId}/copies`);
      setCopyOptions(Array.isArray(copies) ? copies.filter((c) => c.status === "available") : []);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load copies.");
    }
  };

  // Removed unused startManual helper (manual form resets handled inline)

  const submitCheckout = async (body) => {
    resetMessages();
    setSubmitting(true);
    try {
      await api("loans/checkout", { method: "POST", body });
      setMessage("Checkout successful.");
      setSelectedCopy(null);
      setSelectedItem(null);
      setCopyOptions([]);
      setManualForm({ user_id: "", identifier_type: manualForm.identifier_type, identifier_value: "" });
    } catch (err) {
      const code = err?.data?.error;
      const serverMessage = err?.data?.message;
      const fallback = err?.message || "Checkout failed.";
      const mapped =
        code === "loan_limit_exceeded"
          ? "The patron has reached their loan limit."
          : code === "copy_not_available"
            ? "That copy is not available."
            : code === "copy_not_found"
              ? "Copy not found."
              : code === "user_not_found"
                ? "User not found."
                : serverMessage || fallback;
      setError(mapped);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPatron || !selectedCopy) return;
    const body = {
      user_id: selectedPatron.user_id,
      identifier_type: "copy_id",
      copy_id: selectedCopy.copy_id,
      ...(staffUser?.employee_id ? { employee_id: staffUser.employee_id } : {}),
    };
    await submitCheckout(body);
  };

  // (handleManualSubmit is used only in manual form UI if needed; currently commented out or not rendered)
  // eslint-disable-next-line no-unused-vars
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const user_id = Number(manualForm.user_id);
    const identifier = manualForm.identifier_value.trim();
    if (!user_id) {
      setError("Patron ID is required.");
      return;
    }
    if (!identifier) {
      setError(`Enter a ${manualForm.identifier_type === "barcode" ? "barcode" : "copy ID"}.`);
      return;
    }
    const body = {
      user_id,
      identifier_type: manualForm.identifier_type,
      ...(manualForm.identifier_type === "barcode"
        ? { barcode: identifier }
        : { copy_id: Number(identifier) }),
      ...(staffUser?.employee_id ? { employee_id: staffUser.employee_id } : {}),
    };
    await submitCheckout(body);
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-6">
        <header>
          <h2 className="text-lg font-semibold">Checkout Item</h2>
          <p className="text-sm text-gray-600">Search for a patron and choose an available copy.</p>
        </header>

        <Field label="Find Patron">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2"
              value={patronQuery}
              onChange={(e) => setPatronQuery(e.target.value)}
              placeholder="Name, email, or ID"
              onKeyDown={(e) => e.key === "Enter" && searchPatrons()}
            />
            <button
              type="button"
              onClick={searchPatrons}
              disabled={patronLoading}
              className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
            >
              {patronLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </Field>

        {patronResults.length > 0 && (
          <div className="search-results">
            {patronResults.map((patron) => (
              <button
                key={patron.user_id}
                type="button"
                onClick={() => {
                  setSelectedPatron(patron);
                  setPatronResults([]);
                }}
                className="result-item"
                disabled={!patron.is_active}
              >
                <div>
                  <div className="font-semibold text-sm">
                    {patron.first_name} {patron.last_name} (#{patron.user_id})
                  </div>
                  <div className="text-xs text-gray-600">{patron.email || "No email"}</div>
                </div>
                <div className="text-xs">
                  {patron.flagged_for_deletion && (
                    <span className="text-red-500 font-medium mr-2">Flagged</span>
                  )}
                  <span className={patron.is_active ? "status-badge active" : "status-badge inactive"}>
                    {patron.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedPatron && (
          <div className="selected-pill">
            <div>
              <div className="font-semibold text-sm">{selectedPatron.first_name} {selectedPatron.last_name}</div>
              <div className="text-xs text-gray-600">{selectedPatron.email || "No email"}</div>
            </div>
            <button type="button" onClick={() => setSelectedPatron(null)} className="text-xs text-red-500">
              Clear
            </button>
          </div>
        )}

        <Field label="Find Item">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2"
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              placeholder="Title or author"
              onKeyDown={(e) => e.key === "Enter" && searchItems()}
            />
            <button
              type="button"
              onClick={searchItems}
              disabled={itemLoading}
              className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
            >
              {itemLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </Field>

        {itemResults.length > 0 && (
          <div className="search-results">
            {itemResults.map((item) => (
              <button
                key={item.item_id}
                type="button"
                onClick={() => {
                  setSelectedItem(item);
                  setItemResults([]);
                  loadCopies(item.item_id);
                }}
                className="result-item"
              >
                <div className="font-semibold text-sm">
                  {item.title} (#{item.item_id})
                </div>
                <div className="text-xs text-gray-500">
                  {Array.isArray(item.authors) && item.authors.length ? item.authors.join(", ") : "Unknown author"}
                </div>
              </button>
            ))}
          </div>
        )}

        {copyOptions.length > 0 && (
          <div className="copy-picker">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Available copies ({copyOptions.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {copyOptions.map((copy) => (
                <button
                  key={copy.copy_id}
                  type="button"
                  onClick={() => setSelectedCopy(copy)}
                  className={`copy-option ${selectedCopy?.copy_id === copy.copy_id ? "selected" : ""}`}
                >
                  <div className="text-sm font-medium">Copy #{copy.copy_id}</div>
                  <div className="text-xs text-gray-600">
                    Barcode: {copy.barcode || "—"} • Shelf: {copy.shelf_location || "—"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        {message && <div className="mt-2 text-sm text-green-700">{message}</div>}
        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <div className="text-sm font-semibold">
              Patron: {selectedPatron ? `#${selectedPatron.user_id}` : "—"}
            </div>
            <div className="text-sm font-semibold">
              Copy: {selectedCopy ? `#${selectedCopy.copy_id}` : "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!canCheckout}
            className="rounded-md btn-primary px-4 py-2 disabled:opacity-50"
          >
            {submitting ? "Processing…" : "Checkout"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function ReturnLoanPanel({ api, staffUser }) {
  const [form, setForm] = useState({ loan_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setError("Please enter a loan ID, patron name, or item title to search");
      return;
    }

    setSearching(true);
    setError("");
    setSearchResults([]);

    try {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      const data = await api(`staff/loans/active?${params.toString()}`);
      const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
      setSearchResults(list);
      if (list.length === 0) {
        setError("No active loans found matching your search");
      }
    } catch (err) {
      setError(err.message || "Failed to search loans");
    } finally {
      setSearching(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const loan_id = Number(form.loan_id);
      if (!loan_id || loan_id <= 0) {
        throw new Error("Valid Loan ID is required.");
      }

      const body = {
        loan_id,
        ...(staffUser?.employee_id ? { employee_id: staffUser.employee_id } : {}),
      };

      await api("loans/return", { method: "POST", body });
      setMessage(`Successfully returned loan #${loan_id}.`);
      setForm({ loan_id: "" });
      setSearchResults([]);
      setSearchQuery("");
    } catch (err) {
      const code = err?.data?.error;
      const serverMessage = err?.data?.message;
      if (code === "loan_not_found") {
        setError(serverMessage || "Loan not found.");
      } else if (code === "already_returned") {
        setError(serverMessage || "This loan has already been returned.");
      } else if (err?.message) {
        setError(serverMessage || err.message);
      } else {
        setError("Return failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function selectLoan(loan) {
    setForm({ loan_id: String(loan.loan_id) });
    setError("");
    setMessage("");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Return Loan</h2>
          <p className="text-sm text-gray-600">
            Search for an active loan and process the return.
          </p>
        </div>

        <div className="space-y-3">
          <Field label="Search Active Loans">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border px-3 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Loan ID, patron name, or item title"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </Field>

          {searchResults.length > 0 && (
            <div className="rounded-lg border bg-gray-50 p-3 max-h-96 overflow-y-auto">
              <p className="text-xs font-medium text-gray-600 mb-2">
                Found {searchResults.length} active loan(s) - Click to select:
              </p>
              <div className="space-y-2">
                {searchResults.map((loan) => {
                  const borrower = [loan.user_first_name, loan.user_last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  return (
                    <button
                      key={loan.loan_id}
                      type="button"
                      onClick={() => selectLoan(loan)}
                      className="w-full text-left rounded-md border bg-white p-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            Loan #{loan.loan_id} - {loan.item_title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Borrower: {borrower || "Unknown"} (#{loan.user_id})
                          </div>
                          <div className="text-xs text-gray-600">
                            Copy #{loan.copy_id} • Due: {formatDate(loan.due_date)}
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Select →</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Loan ID">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.loan_id}
              onChange={(e) => update("loan_id", e.target.value)}
              placeholder="e.g., 123"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the loan ID manually or select from search results above
            </p>
          </Field>

          {message && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Processing Return..." : "Return Loan"}
          </button>
        </form>
      </div>
    </section>
  );
}
