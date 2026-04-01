const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { minRole } = require("../middleware/roles");
const ctrl = require("../controllers/dashboardController");

router.use(authenticate, minRole("viewer")); // all authenticated users

router.get("/summary", ctrl.getSummary);
router.get("/categories", ctrl.getCategoryTotals);
router.get("/trends/monthly", ctrl.getMonthlyTrends);
router.get("/trends/weekly", ctrl.getWeeklyTrends);
router.get("/recent", ctrl.getRecentActivity);

module.exports = router;
