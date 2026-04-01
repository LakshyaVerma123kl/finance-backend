const request = require("supertest");
const app = require("../src/app");
const { initializeDatabase } = require("../src/models/index");

// Use a test DB
process.env.DB_PATH = ":memory:";

beforeAll(() => {
  initializeDatabase();
});

describe("Auth Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("registers a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@test.com",
        password: "pass1234",
      });
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.role).toBe("viewer");
    });

    it("rejects duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Test", email: "test@test.com", password: "pass1234" });
      expect(res.status).toBe(409);
    });

    it("rejects missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "missing@test.com" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("rejects invalid role", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "X",
        email: "x@x.com",
        password: "123456",
        role: "superuser",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@finance.com", password: "Admin@123" });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("rejects wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@finance.com", password: "wrongpass" });
      expect(res.status).toBe(401);
    });

    it("rejects nonexistent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@nowhere.com", password: "pass" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns current user with valid token", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@finance.com", password: "Admin@123" });
      const token = login.body.token;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("admin@finance.com");
    });

    it("rejects request without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("rejects invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer notarealtoken");
      expect(res.status).toBe(401);
    });
  });
});
