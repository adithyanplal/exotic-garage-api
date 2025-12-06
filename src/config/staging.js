require('dotenv').config(); // Must be first
module.exports = {
  db: process.env.STAGE_DB,
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET
};
