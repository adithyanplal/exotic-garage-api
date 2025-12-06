const Counter = require("../models/Counter");
const settings = require("../config/settings");

async function getNextInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12

  const counterId = `invoice-${year}-${month}`;

  // Increment sequence in DB per month
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // Zero pad sequence: 001, 002...
  const paddedSeq = String(counter.seq).padStart(3, '0');

  return `${settings.invoice.invoicePrefix}-${year}-${month}-${paddedSeq}`;
}

module.exports = getNextInvoiceNumber;
