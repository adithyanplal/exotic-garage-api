const mongoose = require("mongoose");

const SmsLogSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["SENT", "FAILED"], default: "SENT" },
  providerMessageId: { type: String }, 
  providerStatus: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SMSLogs", SmsLogSchema);
