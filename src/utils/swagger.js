const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Finance Dashboard API",
      version: "1.0.0",
      description: `
## Finance Dashboard Backend API

A role-based financial records management system.

### Roles & Permissions

| Role    | View Records | View Dashboard | Create Records | Update Records | Delete Records | Manage Users |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| Viewer  | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analyst | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Admin   | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Authentication
All protected endpoints require a **Bearer token** in the Authorization header.
Login at \`POST /api/auth/login\` to receive your token.

**Default Admin:** \`admin@finance.com\` / \`Admin@123\`
      `,
      contact: { name: "Finance API Support" },
    },
    servers: [
      { url: "http://localhost:3000", description: "Local Development" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Descriptive error message" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Jane Doe" },
            email: { type: "string", example: "jane@example.com" },
            role: { type: "string", enum: ["viewer", "analyst", "admin"] },
            status: { type: "string", enum: ["active", "inactive"] },
            created_at: { type: "string", example: "2025-04-01 09:00:00" },
          },
        },
        FinancialRecord: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            amount: { type: "number", example: 5000 },
            type: { type: "string", enum: ["income", "expense"] },
            category: { type: "string", example: "Salary" },
            date: { type: "string", example: "2025-04-01" },
            notes: { type: "string", example: "April salary" },
            created_by_name: { type: "string", example: "Super Admin" },
            created_at: { type: "string", example: "2025-04-01 09:00:00" },
          },
        },
        DashboardSummary: {
          type: "object",
          properties: {
            total_income: { type: "number", example: 50000 },
            total_expenses: { type: "number", example: 20000 },
            net_balance: { type: "number", example: 30000 },
            total_records: { type: "integer", example: 42 },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & current user" },
      { name: "Users", description: "User management (Admin only)" },
      { name: "Records", description: "Financial records CRUD + export" },
      { name: "Dashboard", description: "Aggregated analytics & trends" },
      { name: "Audit", description: "Audit log (Admin only)" },
    ],
    paths: {
      // ── AUTH ────────────────────────────────────────────────────
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", example: "jane@example.com" },
                    password: { type: "string", example: "secret123" },
                    role: {
                      type: "string",
                      enum: ["viewer", "analyst", "admin"],
                      default: "viewer",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation error" },
            409: { description: "Email already registered" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and get JWT token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "admin@finance.com" },
                    password: { type: "string", example: "Admin@123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful, returns token" },
            401: { description: "Invalid credentials" },
            403: { description: "Account inactive" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current logged-in user",
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: "Current user info" },
            401: { description: "Unauthorized" },
          },
        },
      },
      // ── USERS ───────────────────────────────────────────────────
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List all users (Admin)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "role",
              schema: { type: "string", enum: ["viewer", "analyst", "admin"] },
            },
            {
              in: "query",
              name: "status",
              schema: { type: "string", enum: ["active", "inactive"] },
            },
            {
              in: "query",
              name: "page",
              schema: { type: "integer", default: 1 },
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            200: { description: "List of users" },
            403: { description: "Forbidden" },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Create user (Admin)",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                    role: {
                      type: "string",
                      enum: ["viewer", "analyst", "admin"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            409: { description: "Email taken" },
          },
        },
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user by ID (Admin)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "User found" },
            404: { description: "Not found" },
          },
        },
        patch: {
          tags: ["Users"],
          summary: "Update user (Admin)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: {
                      type: "string",
                      enum: ["viewer", "analyst", "admin"],
                    },
                    status: { type: "string", enum: ["active", "inactive"] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "User updated" } },
        },
        delete: {
          tags: ["Users"],
          summary: "Delete user (Admin)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: { 200: { description: "User deleted" } },
        },
      },
      // ── RECORDS ─────────────────────────────────────────────────
      "/api/records": {
        get: {
          tags: ["Records"],
          summary: "List financial records (all roles)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "type",
              schema: { type: "string", enum: ["income", "expense"] },
            },
            {
              in: "query",
              name: "category",
              schema: { type: "string" },
              description: "Partial match",
            },
            {
              in: "query",
              name: "search",
              schema: { type: "string" },
              description: "Search notes/category",
            },
            {
              in: "query",
              name: "from",
              schema: { type: "string" },
              example: "2025-01-01",
            },
            {
              in: "query",
              name: "to",
              schema: { type: "string" },
              example: "2025-12-31",
            },
            {
              in: "query",
              name: "page",
              schema: { type: "integer", default: 1 },
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: { 200: { description: "Paginated records list" } },
        },
        post: {
          tags: ["Records"],
          summary: "Create financial record (Analyst+)",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount", "type", "category", "date"],
                  properties: {
                    amount: { type: "number", example: 5000 },
                    type: { type: "string", enum: ["income", "expense"] },
                    category: { type: "string", example: "Salary" },
                    date: { type: "string", example: "2025-04-01" },
                    notes: { type: "string", example: "April salary" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Record created" },
            400: { description: "Validation error" },
          },
        },
      },
      "/api/records/export": {
        get: {
          tags: ["Records"],
          summary: "Export records as CSV (Analyst+)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: "query", name: "type", schema: { type: "string" } },
            { in: "query", name: "category", schema: { type: "string" } },
            { in: "query", name: "from", schema: { type: "string" } },
            { in: "query", name: "to", schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "CSV file download",
              content: { "text/csv": {} },
            },
          },
        },
      },
      "/api/records/{id}": {
        get: {
          tags: ["Records"],
          summary: "Get single record (all roles)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Record found" },
            404: { description: "Not found" },
          },
        },
        patch: {
          tags: ["Records"],
          summary: "Update record (Analyst+)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    amount: { type: "number" },
                    type: { type: "string", enum: ["income", "expense"] },
                    category: { type: "string" },
                    date: { type: "string" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Record updated" } },
        },
        delete: {
          tags: ["Records"],
          summary: "Soft delete record (Admin)",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: { 200: { description: "Record soft-deleted" } },
        },
      },
      // ── DASHBOARD ───────────────────────────────────────────────
      "/api/dashboard/summary": {
        get: {
          tags: ["Dashboard"],
          summary: "Total income, expenses, net balance",
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: "Summary totals" } },
        },
      },
      "/api/dashboard/categories": {
        get: {
          tags: ["Dashboard"],
          summary: "Totals grouped by category and type",
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: "Category breakdown" } },
        },
      },
      "/api/dashboard/trends/monthly": {
        get: {
          tags: ["Dashboard"],
          summary: "Monthly income vs expense trends (last 12 months)",
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: "Monthly trend data" } },
        },
      },
      "/api/dashboard/trends/weekly": {
        get: {
          tags: ["Dashboard"],
          summary: "Weekly income vs expense trends (last 8 weeks)",
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: "Weekly trend data" } },
        },
      },
      "/api/dashboard/recent": {
        get: {
          tags: ["Dashboard"],
          summary: "Most recent financial activity",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", default: 10 },
            },
          ],
          responses: { 200: { description: "Recent records" } },
        },
      },
      // ── AUDIT ───────────────────────────────────────────────────
      "/api/audit": {
        get: {
          tags: ["Audit"],
          summary: "View audit log (Admin only)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: "query", name: "user_id", schema: { type: "integer" } },
            { in: "query", name: "action", schema: { type: "string" } },
            { in: "query", name: "entity", schema: { type: "string" } },
            {
              in: "query",
              name: "page",
              schema: { type: "integer", default: 1 },
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", default: 30 },
            },
          ],
          responses: {
            200: { description: "Paginated audit logs" },
            403: { description: "Forbidden" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { swaggerSpec };
