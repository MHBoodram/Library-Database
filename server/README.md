# Server API

Backend: Node.js (no Express), MySQL2. Auth via JWT.

## Env

Create `.env` in `server`:

```bash
DATABASE_URL=mysql://user:pass@localhost:3306/library_team2
JWT_SECRET=change_me
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```

Load schema to MySQL:

- Open `library_db.sql` and run it against your MySQL instance.
- Apply `sql/add_notifications_table.sql` to add the notification feed used by hold-ready alerts.

## Run

- Install deps in `server`: `npm install`
- Start dev: `npm run dev`

## Auth

- POST /api/auth/login { email,password } -> { token }
- GET /api/me (Bearer token)
- POST /api/admin/accounts (admin-only) to provision new users/staff

## Data Entry (examples)

- POST /api/items { title, subject?, classification? }
- PUT /api/items/:id { title?, subject?, classification? }
- DELETE /api/items/:id
- POST /api/copies { item_id, barcode, status?, shelf_location? }
- PUT /api/copies/:id { status?, shelf_location? }
- DELETE /api/copies/:id -> marks lost

## Loans

- POST /api/loans/checkout { user_id?, copy_id, employee_id? }
- POST /api/loans/return { loan_id, employee_id? }

Triggers compute due date, snapshot policy, set copy status, and create overdue fines on return.

## Holds

- POST /api/holds/place { user_id?, item_id | copy_id }
- DELETE /api/holds/:id
- GET /api/staff/holds (staff auth) → joined hold queue data

## Staff

- GET /api/staff/loans/active → active loans with borrower, item, and employee details (staff auth)
- GET /api/staff/fines → searchable fines table (staff auth)
- GET /api/staff/reservations → list reservations (staff auth)
- POST /api/staff/reservations → create reservation slot (staff auth)
- POST /api/staff/rooms → add study rooms (staff auth)

## Reports

- GET /api/reports/overdue
- GET /api/reports/balances
- GET /api/reports/top-items

## Notes

- Policy selection uses `fine_policy.media_type` x `user_category` and snapshots on loan.
- Add appropriate rows to `fine_policy` for combinations you need (book/device/dvd x student/faculty/staff) with loan_days and limits.

### Loan limit trigger

If you have existing data, rerun `server/sql/loan_limit_trigger.sql` against your MySQL instance so faculty members receive an increased active-loan cap (7 vs 5 for others).
