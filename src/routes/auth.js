const router = require("express").Router();
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/authController");

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Invalid role"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerRules, ctrl.register);
router.post("/login", loginRules, ctrl.login);
router.get("/me", authenticate, ctrl.me);

module.exports = router;
