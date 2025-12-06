const router = require("express").Router();
const ctrl = require("../../controllers/invoice.controller");
const auth = require("../../middleware/auth");

// CRUD + PDF generation
router.post("/", auth('admin'), ctrl.create);
router.get("/", auth('admin'), ctrl.getAll);
router.get("/:id", auth('admin'), ctrl.getById);
router.delete("/:id", auth('admin'), ctrl.delete);

module.exports = router;
