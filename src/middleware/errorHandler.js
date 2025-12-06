module.exports = function (err, req, res, next) {
  console.error("GLOBAL_ERROR:", err);
  res.status(500).json({
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
