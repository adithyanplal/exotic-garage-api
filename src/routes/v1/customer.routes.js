const router = require("express").Router();
const ctrl = require("../../controllers/customer.controller");
const auth = require("../../middleware/auth");

// CRUD routes
router.post("/", auth('admin'), ctrl.create);
router.get("/", auth('admin'), ctrl.getAll);
router.get("/:id", auth('admin'), ctrl.getById);
router.put("/:id", auth('admin'), ctrl.update);
router.delete("/:id", auth('admin'), ctrl.delete);
router.get("/vehicle/:vehicleNo", auth('admin'), ctrl.getByVehicle);

module.exports = router;
