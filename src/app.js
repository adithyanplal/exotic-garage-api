// app.js

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const config = require("./config");
const routes = require("./routes");

// --------------------
// Connect to MongoDB
// --------------------
require("./config/db")();

// --------------------
// Create Express App
// --------------------
const app = express();

// --------------------
// CORS Configuration
// --------------------
const allowedOrigins = [
  "http://localhost:3000",       // local dev frontend
  "http://127.0.0.1:3000",
  "https://erp.exoticgarage.in", // production ERP frontend
  "https://www.erp.exoticgarage.in"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS policy: This origin is not allowed"), false);
    }
    return callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // allow cookies/auth headers
  optionsSuccessStatus: 200
}));

// Enable preflight requests for all routes
app.options("*", cors());

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use(morgan("dev"));

// --------------------
// Serve Static Files
// --------------------
const publicDir = path.join(__dirname, "public");
const invoicesDir = path.join(__dirname, "invoices");

app.use("/public", express.static(publicDir, { maxAge: "1h" }));
app.use("/invoices", express.static(invoicesDir, { maxAge: "1h" }));

// --------------------
// API Routes
// --------------------
app.use("/api", routes);
app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});


// --------------------
// 404 Handler
// --------------------
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// --------------------
// Global Error Handler
// --------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// --------------------
// Start Server (optional if using PM2)
// --------------------
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
