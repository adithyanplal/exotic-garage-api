require('dotenv').config(); // Must be first
module.exports = {
  db: process.env.PROD_DB,
  port: process.env.PORT || 3002,
  jwtSecret: process.env.JWT_SECRET
};
