# Library Database

A Library database web application.
**Webapp Link:** [https://library-database-xi.vercel.app/]

Overview
--------
This application allows students and faculty to borrow library resources (books, media, devices, etc.) as well as book study rooms, librarians to manage these resources

Key features
------------
- Borrow books, media, devices, and other items.
- Separate user categories (e.g., student, faculty) with different:
  - Maximum number of items they can borrow.
  - Loan period (number of days allowed before due).
- Overdue fine calculation and storage
- Place holds on items if requested item out of stock.
- Reports for overdue items, new patrons, and transaction history.
- Auth with admin-provisioned accounts and role-based access (student, faculty, staff).

Architecture/Technologies
------------
- Frontend: React d
- Backend: Node.js
- Database: MYSQL


Setup & running
---------------
1. Clone the Repo and navigate to the project folder
```bash
git clone https://github.com/MHBoodram/Library-Database.git
cd Library-Database
```
2. Install all needed dependencies
- For client:
  ```bash
  cd client
  npm install
  ```
- For server:
  ```bash
  cd server
  npm install
  ```
3. Create .env files
For locally hosted frontend/backend but using our Azure database:
- Create a .env file in the client/ directory with the following variables
  (replacing the #comment with corresponding info found in our project report):
  ```env
  NODE_ENV=production
  PORT=3000 
  # REFER TO "Database .env variables" SECTION OF PROJECT REPORT FOR THIS LINE
  LIBRARY_TZ=America/Chicago
  JWT_SECRET=change_me_to_a_long_random_string
  FRONTEND_ORIGIN=http://localhost:5173
  DB_SSL=on
  ```
- Create a .env file in the server/ directory with the following variables:
  ```env
  NODE_ENV=development
  PORT=3000
  # REFER TO "Database .env variables" SECTION OF PROJECT REPORT FOR THIS LINE
  JWT_SECRET=change_me_to_a_long_random_string
  FRONTEND_ORIGIN=http://localhost:3000
  VITE_API_BASE = http://localhost:3000/api
  ```
4. Run the webapp (run both frontend and backend)
- Run the backend by opening a terminal to the project folder, navigating to the server/ directory and running npm run dev
  ```bash
  cd server
  npm run dev
  ```
- Run the frontend by opening a terminal to the project folder, navigating to the client/ directory and running npm run dev
  ```bash
  cd client
  npm run dev
  ```

