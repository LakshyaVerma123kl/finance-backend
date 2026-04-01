const request = require("supertest");
const app = require("../src/app");
const { initializeDatabase } = require("../src/models/index");

process.env.DB_PATH = ":memory:";
beforeAll(() => {
  initializeDatabase();
});

let adminToken, viewerToken;

beforeAll(async () => {
  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@finance.com", password: "Admin@123" });
  adminToken = adminLogin.body.token;

  await request(app).post("/api/auth/register").send({
    name: "Viewer",
    email: "viewer@test.com",
    password: "pass1234",
    role: "viewer",
  });
  const viewerLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "viewer@test.com", password: "pass1234" });
  viewerToken = viewerLogin.body.token;
});

describe("Financial Records", () => {
  let recordId;

  describe("POST /api/records", () => {
    it("admin can create a record", async () => {
      const res = await request(app)
        .post("/api/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 1000,
          type: "income",
          category: "Salary",
          date: "2025-01-15",
          notes: "Test",
        });
      expect(res.status).toBe(201);
      expect(res.body.record.amount).toBe(1000);
      recordId = res.body.record.id;
    });

    it("viewer cannot create a record", async () => {
      const res = await request(app)
        .post("/api/records")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({
          amount: 500,
          type: "expense",
          category: "Food",
          date: "2025-01-16",
        });
      expect(res.status).toBe(403);
    });

    it("rejects negative amount", async () => {
      const res = await request(app)
        .post("/api/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: -100,
          type: "income",
          category: "X",
          date: "2025-01-01",
        });
      expect(res.status).toBe(400);
    });

    it("rejects invalid type", async () => {
      const res = await request(app)
        .post("/api/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 100,
          type: "profit",
          category: "X",
          date: "2025-01-01",
        });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/records", () => {
    it("viewer can list records", async () => {
      const res = await request(app)
        .get("/api/records")
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
    });

    it("supports type filter", async () => {
      const res = await request(app)
        .get("/api/records?type=income")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      res.body.records.forEach((r) => expect(r.type).toBe("income"));
    });

    it("supports search filter", async () => {
      const res = await request(app)
        .get("/api/records?search=Salary")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("unauthenticated request is rejected", async () => {
      const res = await request(app).get("/api/records");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/records/:id", () => {
    it("admin can update a record", async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 2000, notes: "Updated" });
      expect(res.status).toBe(200);
      expect(res.body.record.amount).toBe(2000);
    });

    it("viewer cannot update a record", async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ amount: 999 });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/records/:id", () => {
    it("viewer cannot delete a record", async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it("admin can soft-delete a record", async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("deleted record is no longer visible", async () => {
      const res = await request(app)
        .get(`/api/records/${recordId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
