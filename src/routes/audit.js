const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const ctrl = require("../controllers/auditController");

// Admin-only audit trail
router.get("/", authenticate, allowRoles("admin"), ctrl.listLogs);

module.exports = router;
