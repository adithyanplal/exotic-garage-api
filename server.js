require('dotenv').config(); // Must be first
const app = require('./src/app');
const config = require('./src/config');
const connectDB = require('./src/config/db');

const PORT = config.port;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
