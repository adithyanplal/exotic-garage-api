// utils/invoiceNumber.js (UPDATED to use atomic counter)

const settings = require("../config/settings");
const Counter = require("../models/Counter"); // 1. Import the new Counter model

// Note: You no longer need to import the Invoice model for the sequence logic.

async function getNextInvoiceNumber(invoiceDate = new Date()) {
  const date = new Date(invoiceDate);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid invoice date");
  }

  const year = date.getFullYear();
  // date.getMonth() returns 0 for January, so we add 1
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // 2. Define the unique ID for the monthly counter document
  // e.g., "EGA-2025-12"
  const counterId = `${settings.invoice.invoicePrefix}-${year}-${month}`;

  // 3. ATOMICALLY Find the document for the current month and increment its 'seq' field.
  // This operation eliminates the race condition.
  const counterDoc = await Counter.findOneAndUpdate(
    { _id: counterId }, // FIND the counter for this month
    { $inc: { seq: 1 } }, // INCREMENT the sequence number
    { 
      new: true, // Return the document *after* the update
      upsert: true, // Create the document if it doesn't exist
      setDefaultsOnInsert: true // Use the default value (e.g., 1000) for the first time
    }
  );
  
  // 4. Construct the final invoice number using the atomically reserved sequence
  const paddedSeq = String(counterDoc.seq).padStart(3, "0");

  // e.g., EGA-2025-12-1001 (if default was 1000)
  return `${counterId}-${paddedSeq}`;
}

module.exports = getNextInvoiceNumber;