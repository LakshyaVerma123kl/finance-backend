# Finance Dashboard Backend

A role-based finance data management backend built with Node.js, Express, and SQLite.

## Tech Stack

- **Node.js + Express** – REST API
- **SQLite (better-sqlite3)** – File-based database, no server needed
- **JWT + bcrypt** – Authentication
- **express-validator** – Input validation

## Setup

```bash
npm install
npm run dev
```

Default admin seeded on first run:

- Email: `admin@finance.com`
- Password: `Admin@123`

## Roles & Permissions

| Action         | Viewer | Analyst | Admin |
| -------------- | ------ | ------- | ----- |
| View records   | ✅     | ✅      | ✅    |
| View dashboard | ✅     | ✅      | ✅    |
| Create records | ❌     | ✅      | ✅    |
| Update records | ❌     | ✅      | ✅    |
| Delete records | ❌     | ❌      | ✅    |
| Manage users   | ❌     | ❌      | ✅    |

## API Endpoints

### Auth

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| POST   | /api/auth/register | Register user     |
| POST   | /api/auth/login    | Login & get token |
| GET    | /api/auth/me       | Current user info |

### Users (Admin only)

| Method | Endpoint       | Description |
| ------ | -------------- | ----------- |
| GET    | /api/users     | List users  |
| GET    | /api/users/:id | Get user    |
| POST   | /api/users     | Create user |
| PATCH  | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

### Financial Records

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| GET    | /api/records     | List (filter by query) |
| GET    | /api/records/:id | Get single record      |
| POST   | /api/records     | Create (analyst+)      |
| PATCH  | /api/records/:id | Update (analyst+)      |
| DELETE | /api/records/:id | Soft delete (admin)    |

**Query filters:** `?type=income&category=rent&from=2024-01-01&to=2024-12-31&page=1&limit=20`

### Dashboard (all authenticated)

| Method | Endpoint                      | Description          |
| ------ | ----------------------------- | -------------------- |
| GET    | /api/dashboard/summary        | Total income/expense |
| GET    | /api/dashboard/categories     | Category-wise totals |
| GET    | /api/dashboard/trends/monthly | Last 12 months       |
| GET    | /api/dashboard/trends/weekly  | Last 8 weeks         |
| GET    | /api/dashboard/recent         | Recent activity      |

## Design Decisions

- **Soft delete** on records (deleted_at column) preserves audit history
- **SQLite WAL mode** for better concurrent read performance
- **Role hierarchy** enforced at middleware level, not mixed into business logic
- **Password never returned** in any API response
- **Self-protection**: admins cannot delete/demote themselves
