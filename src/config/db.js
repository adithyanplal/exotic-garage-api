const mongoose = require("mongoose");
const config = require("./index");

module.exports = async () => {
  if (!config.db) {
    throw new Error("MongoDB URI is undefined. Check your .env and config files!");
  }

  try {
    await mongoose.connect(config.db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("📌 MongoDB Connected:", config.db);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};
