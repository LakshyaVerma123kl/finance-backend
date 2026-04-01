const router = require("express").Router();
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { allowRoles, minRole } = require("../middleware/roles");
const ctrl = require("../controllers/recordController");

const createRequired = [
  body("amount")
    .notEmpty()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("type")
    .notEmpty()
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),
  body("category").notEmpty().trim().withMessage("Category is required"),
  body("date").notEmpty().isDate().withMessage("Date must be YYYY-MM-DD"),
];

const updateRules = [
  body("amount").optional().isFloat({ gt: 0 }),
  body("type").optional().isIn(["income", "expense"]),
  body("category").optional().trim().notEmpty(),
  body("date").optional().isDate(),
];

router.use(authenticate);

router.get("/export", minRole("analyst"), ctrl.exportCSV); // CSV export
router.get("/", minRole("viewer"), ctrl.listRecords);
router.get("/:id", minRole("viewer"), ctrl.getRecord);
router.post("/", minRole("analyst"), createRequired, ctrl.createRecord);
router.patch(
  "/:id",
  allowRoles("analyst", "admin"),
  updateRules,
  ctrl.updateRecord,
);
router.delete("/:id", allowRoles("admin"), ctrl.deleteRecord);

module.exports = router;
