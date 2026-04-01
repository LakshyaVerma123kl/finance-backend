require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./utils/swagger");
const { httpLogger } = require("./middleware/logger");
const { authLimiter, apiLimiter } = require("./middleware/rateLimiter");
const { initializeDatabase } = require("./models/index");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const recordRoutes = require("./routes/records");
const dashboardRoutes = require("./routes/dashboard");
const auditRoutes = require("./routes/audit");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Logging ────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);
app.use("/api/", apiLimiter);

// ── Swagger Docs ──────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Finance API Docs",
    customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
    swaggerOptions: { persistAuthorization: true },
  }),
);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_, res) =>
  res.json({
    status: "ok",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
  }),
);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    docs: "Visit /api-docs for full API documentation",
  }),
);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ── Init DB then start ────────────────────────────────────────
if (require.main === module) {
  initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀  Server running at http://localhost:${PORT}`);
    console.log(`📖  API Docs at   http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app; // needed for tests
