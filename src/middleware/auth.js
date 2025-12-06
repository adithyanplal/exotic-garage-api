const jwt = require("jsonwebtoken");

// Role-based authentication
module.exports = function (roles = []) {
  return function (req, res, next) {
    // Allow roles parameter to be a single string
    if (typeof roles === "string") roles = [roles];

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Check role
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error("AUTH_MIDDLEWARE_ERR", err);
      res.status(401).json({ message: "Invalid token" });
    }
  };
};
