const Invoice = require("../models/Invoice");
const settings = require("../config/settings");

async function getNextInvoiceNumber(invoiceDate = new Date()) {
  // Ensure invoiceDate is a valid Date object
  const date = new Date(invoiceDate);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid invoice date");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 11 for November

  // Start and end of the month based on invoiceDate
  const startOfMonth = new Date(year, date.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59, 999);

  // Find last invoice in this month
  const lastInvoice = await Invoice.findOne({
    invoiceDate: { $gte: startOfMonth, $lte: endOfMonth },
  })
    .sort({ invoiceNo: -1 })
    .exec();

  let nextSeq = 1;
  if (lastInvoice && lastInvoice.invoiceNo) {
    const parts = lastInvoice.invoiceNo.split("-");
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  const paddedSeq = String(nextSeq).padStart(3, "0");
  return `${settings.invoice.invoicePrefix}-${year}-${month}-${paddedSeq}`;
}

module.exports = getNextInvoiceNumber;