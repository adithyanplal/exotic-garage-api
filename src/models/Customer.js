const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String,required:true },
  address: { type: String },
  vehicleNo: { type: String, required: true, unique: true },
  rewardPoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Customer", CustomerSchema);
