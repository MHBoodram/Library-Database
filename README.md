```markdown
# Library Database

A Library database web application.

Overview
--------
This application allows students and faculty to borrow library resources (books, media, devices, etc.). It supports multiple copies of the same item, per-item identifiers, borrowing rules that vary by user category, holds/requests, and overdue fine handling.

Key features
------------
- Borrow books, media, devices, and other items.
- Separate user categories (e.g., student, faculty) with different:
  - Maximum number of items they can borrow.
  - Loan period (number of days allowed before due).
- Each item has a canonical Item ID; the library can track multiple Copies of an Item (each copy has its own barcode/ID).
- Overdue fine calculation and storage — fine policies can vary by media type and user category.
- Place holds/requests on items (by item or by copy).
- Reports for overdue items, balances, and top-borrowed items.
- Auth with admin-provisioned accounts and role-based access (student, faculty, staff).

Architecture
------------
- server/ — Backend API (Node.js, MySQL2, JWT-based auth).
- client/ — Frontend (React + Vite template).

API highlights (server)
-----------------------
- Auth:
  - POST /api/auth/login { email, password } -> { token }
  - GET /api/me (Bearer token)
  - POST /api/admin/accounts (admin-only; provision new users/staff)
- Items & copies:
  - POST /api/items { title, subject?, classification? }
  - PUT /api/items/:id { title?, subject?, classification? }
  - DELETE /api/items/:id
  - POST /api/copies { item_id, barcode, status?, shelf_location? }
  - PUT /api/copies/:id { status?, shelf_location? }
  - DELETE /api/copies/:id -> marks lost
- Loans:
  - POST /api/loans/checkout { user_id?, copy_id, employee_id? }
  - POST /api/loans/return { loan_id, employee_id? }
  - Triggers compute due date, snapshot policy, set copy status, and create overdue fines on return.
- Holds:
  - POST /api/holds/place { user_id?, item_id | copy_id }
  - DELETE /api/holds/:id
  - GET /api/staff/holds (staff dashboard queue overview)
- Reports:
  - GET /api/reports/overdue
  - GET /api/reports/balances
  - GET /api/reports/top-items

Policy & fines
--------------
- Policy selection uses the combination of media type and user category (e.g., book x student, device x faculty).
- The fine policy table should include loan_days and limits per (media_type, user_category) combination.
- Loan snapshots are taken when checking out to ensure the due date and rules are preserved even if policies change later.
- Overdue fines are created/updated when items are returned late or by scheduled processes that compute balances.

Setup & running
---------------
- See server/README.md for backend setup (env vars, database schema):
  - You'll need to create a `.env` in `server` with configuration such as DATABASE_URL, JWT_SECRET, PORT, and FRONTEND_ORIGIN.
  - Load `library_db.sql` into your MySQL instance before running.
- See client/README.md for frontend notes.

Contributing
------------
- Fork and open pull requests.
- Add or update `fine_policy` rows for any new media types / user categories.
- Add integration tests for checkout/return/hold flows when implementing policy changes.

Notes
-----
- Make sure `fine_policy` entries exist for the combinations of item media types and user categories you intend to support (e.g., book/student, book/faculty, device/student).
- The system expects that copies are individually tracked (barcode/ID) and that loans reference copies; holds can be placed either on an item (any available copy) or a specific copy.

License
-------
(Include repository license here if applicable)
```
