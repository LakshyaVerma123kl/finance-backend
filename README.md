# Finance Dashboard Backend

A role-based financial data management REST API built with Node.js, Express, and SQLite. Ships with JWT authentication, audit logging, soft deletes, and Swagger docs out of the box.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 5 |
| Database | SQLite via `better-sqlite3` (WAL mode) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Docs | Swagger UI (`/api-docs`) |
| Testing | Jest + Supertest |

---

## Quick Start

```bash
npm install
npm run dev
```

The server starts at `http://localhost:3000`.  
API docs are at `http://localhost:3000/api-docs`.

**Default admin account (seeded on first run):**

```
Email:    admin@finance.com
Password: Admin@123
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## Roles & Permissions

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| View records | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ✅ |
| Create records | ❌ | ✅ | ✅ |
| Update records | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ✅ |

---

## API Reference

All protected endpoints require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Get current user info |

### Users *(Admin only)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List users (filter by role/status) |
| `GET` | `/api/users/:id` | Get a user by ID |
| `POST` | `/api/users` | Create a user |
| `PATCH` | `/api/users/:id` | Update name, role, or status |
| `DELETE` | `/api/users/:id` | Permanently delete a user |

### Financial Records

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/records` | List records with filters |
| `GET` | `/api/records/:id` | Get a single record |
| `POST` | `/api/records` | Create a record *(Analyst+)* |
| `PATCH` | `/api/records/:id` | Update a record *(Analyst+)* |
| `DELETE` | `/api/records/:id` | Soft delete *(Admin)* |
| `GET` | `/api/records/export` | Download CSV *(Analyst+)* |

**Query filters for `GET /api/records`:**
```
?type=income&category=salary&search=rent&from=2025-01-01&to=2025-12-31&page=1&limit=20
```

### Dashboard *(all authenticated users)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Total income, expenses, net balance |
| `GET` | `/api/dashboard/categories` | Totals grouped by category |
| `GET` | `/api/dashboard/trends/monthly` | Last 12 months trend |
| `GET` | `/api/dashboard/trends/weekly` | Last 8 weeks trend |
| `GET` | `/api/dashboard/recent` | Recent activity feed |

### Audit Log *(Admin only)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/audit` | Paginated audit trail |

---

## Project Structure

```
src/
├── app.js                  # Express app entry point
├── config/
│   └── database.js         # SQLite connection (singleton)
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── recordController.js
│   ├── dashboardController.js
│   └── auditController.js
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── roles.js            # allowRoles / minRole guards
│   ├── rateLimiter.js      # Auth (20/15min) + API (100/min)
│   └── logger.js           # Morgan HTTP logging
├── models/
│   ├── index.js            # Schema init + admin seed
│   └── auditLog.js         # Audit log model
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── records.js
│   ├── dashboard.js
│   └── audit.js
└── utils/
    ├── csvExport.js
    └── swagger.js
tests/
├── auth.test.js
├── records.test.js
└── dashboard.test.js
```

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Run in production mode |
| `npm run dev` | Run with nodemon (hot reload) |
| `npm test` | Run Jest test suite |

---

## Design Decisions

- **Soft deletes** — records get a `deleted_at` timestamp instead of being removed, preserving audit history
- **WAL mode** — SQLite is configured with Write-Ahead Logging for better concurrent read performance
- **Role hierarchy** enforced in middleware, not scattered through business logic
- **Passwords never returned** in any API response
- **Self-protection** — admins cannot delete or demote their own account
- **Audit log** captures every mutating action with user identity, IP, and payload details