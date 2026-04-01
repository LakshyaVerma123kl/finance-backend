const router = require("express").Router();
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const ctrl = require("../controllers/userController");

const createRules = [
  body("name").trim().notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("role").optional().isIn(["viewer", "analyst", "admin"]),
];

const updateRules = [
  body("role").optional().isIn(["viewer", "analyst", "admin"]),
  body("status").optional().isIn(["active", "inactive"]),
];

// All user management → admin only
router.use(authenticate, allowRoles("admin"));

router.get("/", ctrl.listUsers);
router.get("/:id", ctrl.getUser);
router.post("/", createRules, ctrl.createUser);
router.patch("/:id", updateRules, ctrl.updateUser);
router.delete("/:id", ctrl.deleteUser);

module.exports = router;
