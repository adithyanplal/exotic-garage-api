const InvoiceService = require("../services/invoice.service");
const CustomerService = require("../services/customer.service");
const { generateInvoicePDF } = require("../utils/pdf/invoiceGenerator");
const getNextInvoiceNumber = require("../utils/invoiceNumber");
const SmsService = require("../services/sms.service");

/**
 * Helper to ensure date string "YYYY-MM-DD" is treated as the intended date 
 * regardless of server timezone by setting the time to noon (12:00 PM).
 * @param {string} dateString 
 * @returns {Date}
 */
const safeParseDate = (dateString) => {
    if (!dateString) return new Date();
    
    const d = new Date(dateString); 
    
    // If the date is valid, set the time to 12:00 PM in the server's local time,
    // which prevents timezone shifts from flipping the day/month.
    if (!isNaN(d.getTime())) {
        d.setHours(12, 0, 0, 0); 
        return d;
    }
    return new Date();
};


// CREATE INVOICE
exports.create = async (req, res) => {
    try {
        const invoiceData = req.body;
        let customer;

        // 🚀 Step 0: Store the requested invoice date string from the payload
        const requestedInvoiceDateStr = req.body.invoiceDate || req.body.customer?.invoiceDate;

        // 1️⃣ Check if customer exists by vehicle number
        if (invoiceData.customer.vehicleNo) {
            customer = await CustomerService.getByVehicleNumber(invoiceData.customer.vehicleNo);
        }

        // 1.1️⃣ Create new customer if not exists
        if (!customer) {
            const newCustomerData = {
                name: invoiceData.customer.name,
                phone: invoiceData.customer.phone,
                email: invoiceData.customer.email,
                address: invoiceData.customer.address,
                vehicleNo: invoiceData.customer.vehicleNo,
                rewardPoints: 0,
            };
            customer = await CustomerService.create(newCustomerData);
        }

        // Assign the newly created/found customer ID to the invoice data
        invoiceData.customer = customer._id;

        // 2️⃣ Use safeParseDate to correctly interpret the date string
        invoiceData.invoiceDate = safeParseDate(requestedInvoiceDateStr);

        // 3️⃣ Get next invoice number based on the CORRECT date
        const invoiceNo = await getNextInvoiceNumber(invoiceData.invoiceDate);
        invoiceData.invoiceNo = invoiceNo;

        // 4️⃣ Ensure payment object exists
        if (!invoiceData.payment || typeof invoiceData.payment !== "object") {
            invoiceData.payment = {};
        }

        // 5️⃣ Calculate grandTotal if not provided
        if (!invoiceData.payment.grandTotal) {
            invoiceData.payment.grandTotal = invoiceData.items.reduce(
                (acc, item) => acc + (item.price || 0) * (item.qty || 0),
                0
            );
        }

        // 6️⃣ Save invoice
        const saved = await InvoiceService.create(invoiceData);

        // 7️⃣ Populate customer
        await saved.populate("customer");

        // 8️⃣ Generate PDF
        const pdfPath = await generateInvoicePDF({
            customer: { ...saved.customer.toObject(), invoiceNo, date: saved.invoiceDate },
            items: saved.items,
            payment: saved.payment,
        });

        // 9️⃣ Save PDF path
        saved.pdfPath = pdfPath?.publicUrl?.publicUrl || "";
        await saved.save();

        // 🔟 Reward points
        const points = Math.floor(saved.payment.grandTotal / 100);
        const updatedCustomer = await CustomerService.addRewardPoints(saved.customer._id, points);

        // 1️⃣1️⃣ Send SMS
        if (saved.customer.phone) {
            await SmsService.sendInvoiceLink({
                customer: saved.customer,
                phone: saved.customer.phone,
                invoiceId: saved._id,
                link: saved.pdfPath,
            });
        }

        res.status(201).json({
            message: "Invoice created successfully",
            invoice: saved,
            pdfPath: saved.pdfPath,
            rewardPointsEarned: points,
            customerRewardPoints: updatedCustomer.rewardPoints,
        });
    } catch (err) {
        console.error("INVOICE_CREATE_ERR", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
};

// GET ALL INVOICES
exports.getAll = async (req, res) => {
  try {
    const invoices = await InvoiceService.getAll();
    res.json(invoices);
  } catch (err) {
    console.error("INVOICE_GET_ALL_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET INVOICE BY ID
exports.getById = async (req, res) => {
  try {
    const invoice = await InvoiceService.getById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    console.error("INVOICE_GET_ID_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE INVOICE
exports.delete = async (req, res) => {
  try {
    await InvoiceService.delete(req.params.id);
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error("INVOICE_DELETE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE AND REGENERATE INVOICE
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 1️⃣ Fetch the existing invoice to handle reward point reversal
        const oldInvoice = await InvoiceService.getById(id);
        if (!oldInvoice) return res.status(404).json({ error: "Invoice not found" });

        // 2️⃣ Handle Date & Invoice Number (Optional)
        // If the date changed, you might need to re-run getNextInvoiceNumber 
        // depending on your business logic for sequential numbers.
        if (updateData.invoiceDate) {
            updateData.invoiceDate = safeParseDate(updateData.invoiceDate);
        }

        // 3️⃣ Recalculate Grand Total if items changed
        if (updateData.items) {
            updateData.payment = updateData.payment || {};
            updateData.payment.grandTotal = updateData.items.reduce(
                (acc, item) => acc + (item.price || 0) * (item.qty || 0),
                0
            );
        }

        // 4️⃣ Update the Database record
        const updatedInvoice = await InvoiceService.update(id, updateData);
        await updatedInvoice.populate("customer");

        // 5️⃣ Regenerate the PDF
        // This overwrites the old PDF or creates a new version
        const pdfPath = await generateInvoicePDF({
            customer: { 
                ...updatedInvoice.customer.toObject(), 
                invoiceNo: updatedInvoice.invoiceNo, 
                date: updatedInvoice.invoiceDate 
            },
            items: updatedInvoice.items,
            payment: updatedInvoice.payment,
        });

        // 6️⃣ Update the PDF URL in the document
        updatedInvoice.pdfPath = pdfPath?.publicUrl?.publicUrl || updatedInvoice.pdfPath;
        await updatedInvoice.save();

        // 7️⃣ Sync Reward Points
        // Reverse old points and add new ones to keep the customer balance accurate
        const oldPoints = Math.floor((oldInvoice.payment?.grandTotal || 0) / 100);
        const newPoints = Math.floor((updatedInvoice.payment?.grandTotal || 0) / 100);
        
        await CustomerService.addRewardPoints(updatedInvoice.customer._id, -oldPoints); // Subtract old
        const updatedCustomer = await CustomerService.addRewardPoints(updatedInvoice.customer._id, newPoints); // Add new

        res.json({
            message: "Invoice updated and PDF regenerated successfully",
            invoice: updatedInvoice,
            pdfPath: updatedInvoice.pdfPath,
            customerRewardPoints: updatedCustomer.rewardPoints
        });

    } catch (err) {
        console.error("INVOICE_UPDATE_ERR", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
};
