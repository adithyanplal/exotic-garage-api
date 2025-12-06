const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboard.controller");

// GET /api/v1/dashboard
router.get("/", dashboardController.getAnalytics);

module.exports = router;
