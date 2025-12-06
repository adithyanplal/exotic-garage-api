const express = require("express");
const router = express.Router();

// Module routes
router.use("/auth", require("./auth.routes"));
router.use("/customers", require("./customer.routes"));
router.use("/services", require("./service.routes"));
router.use("/invoices", require("./invoice.routes"));
router.use("/dashboard", require("./dashboard.routes"));

module.exports = router;
