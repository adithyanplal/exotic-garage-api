const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  warrantyFrom: { type: Date },
  warrantyTo: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Service", ServiceSchema);
