require('dotenv').config(); // Must be first
module.exports = {
  db: process.env.STAGE_DB,
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET
};
