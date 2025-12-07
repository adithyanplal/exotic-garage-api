const Counter = require("../models/Counter");
const settings = require("../config/settings");

async function getNextInvoiceNumber(invoiceDate = new Date()) {
  const date = new Date(invoiceDate);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const counterId = `invoice-${year}-${month}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(3, '0');

  return `${settings.invoice.invoicePrefix}-${year}-${month}-${paddedSeq}`;
}

module.exports = getNextInvoiceNumber;

