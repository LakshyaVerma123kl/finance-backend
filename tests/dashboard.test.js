const request = require("supertest");
const app = require("../src/app");
const { initializeDatabase } = require("../src/models/index");

process.env.DB_PATH = ":memory:";
beforeAll(() => {
  initializeDatabase();
});

let token;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@finance.com", password: "Admin@123" });
  token = res.body.token;

  // Seed some data
  const headers = { Authorization: `Bearer ${token}` };
  await request(app).post("/api/records").set(headers).send({
    amount: 5000,
    type: "income",
    category: "Salary",
    date: "2025-01-10",
  });
  await request(app).post("/api/records").set(headers).send({
    amount: 800,
    type: "expense",
    category: "Rent",
    date: "2025-01-15",
  });
  await request(app).post("/api/records").set(headers).send({
    amount: 200,
    type: "expense",
    category: "Food",
    date: "2025-01-20",
  });
});

describe("Dashboard Endpoints", () => {
  it("GET /api/dashboard/summary returns correct totals", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.total_income).toBeGreaterThanOrEqual(5000);
    expect(res.body.summary.total_expenses).toBeGreaterThanOrEqual(1000);
    expect(res.body.summary).toHaveProperty("net_balance");
  });

  it("GET /api/dashboard/categories returns breakdown", async () => {
    const res = await request(app)
      .get("/api/dashboard/categories")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.category_totals)).toBe(true);
  });

  it("GET /api/dashboard/trends/monthly returns array", async () => {
    const res = await request(app)
      .get("/api/dashboard/trends/monthly")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.monthly_trends)).toBe(true);
  });

  it("GET /api/dashboard/trends/weekly returns array", async () => {
    const res = await request(app)
      .get("/api/dashboard/trends/weekly")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.weekly_trends)).toBe(true);
  });

  it("GET /api/dashboard/recent returns last activities", async () => {
    const res = await request(app)
      .get("/api/dashboard/recent?limit=5")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recent_activity)).toBe(true);
  });

  it("unauthenticated access is rejected", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.status).toBe(401);
  });
});
