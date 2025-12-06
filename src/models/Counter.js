const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g., 'invoice'
  seq: { type: Number, default: 1000 }   // starting number
});

module.exports = mongoose.model("Counter", counterSchema);
