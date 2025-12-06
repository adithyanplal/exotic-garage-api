const router = require("express").Router();
const ctrl = require("../../controllers/service.controller");
const auth = require("../../middleware/auth");

// CRUD routes
router.post("/", auth, ctrl.create);
router.get("/", auth, ctrl.getAll);
router.get("/:id", auth, ctrl.getById);
router.put("/:id", auth, ctrl.update);
router.delete("/:id", auth, ctrl.delete);

module.exports = router;
