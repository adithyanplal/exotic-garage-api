const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  invoiceNo: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now }, // fixed here
  items: [
    {
      service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      name: { type: String },
      description: { type: String },
      price: { type: Number },
      qty: { type: Number, default: 1 },
      warrantyFrom: { type: Date },
      warrantyTo: { type: Date },
    },
  ],
  payment: {
    method: { type: String },
    taxable: { type: Boolean, default: true },
    paidAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
  },
  pdfPath: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
