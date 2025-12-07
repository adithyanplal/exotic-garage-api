const InvoiceService = require("../services/invoice.service");
const CustomerService = require("../services/customer.service");
const { generateInvoicePDF } = require("../utils/pdf/invoiceGenerator");
const getNextInvoiceNumber = require("../utils/invoiceNumber");
const SmsService = require("../services/sms.service");

// CREATE INVOICE
exports.create = async (req, res) => {
  try {
    const invoiceData = req.body;
    let customer;

    // 1️⃣ Check if customer exists by vehicle number
    if (invoiceData.customer.vehicleNo) {
      customer = await CustomerService.getByVehicleNumber(invoiceData.customer.vehicleNo);
    }

    if (!customer) {
      // 1.1️⃣ Create new customer
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

    invoiceData.customer = customer._id;
    invoiceData.invoiceDate = invoiceData.invoiceDate
  ? new Date(invoiceData.invoiceDate)
  : new Date();


    // 2️⃣ Get next invoice number
   const invoiceNo = await getNextInvoiceNumber(invoiceData.invoiceDate);
invoiceData.invoiceNo = invoiceNo;

    // 2.1️⃣ Calculate grandTotal if not provided
    if (!invoiceData.payment.grandTotal) {
      invoiceData.payment.grandTotal = invoiceData.items.reduce(
        (acc, item) => acc + item.price * item.qty,
        0
      );
    }

    // 3️⃣ Save invoice
    const saved = await InvoiceService.create(invoiceData);

    // 3.1️⃣ Populate customer
    await saved.populate("customer");

    // 4️⃣ Generate PDF
    const pdfPath = await generateInvoicePDF({
      customer: { ...saved.customer.toObject(), invoiceNo, date: saved.invoiceDate },
      items: saved.items,
      payment: saved.payment,
    });

    // 5️⃣ Save PDF path
   saved.pdfPath = pdfPath.publicUrl.publicUrl;
    await saved.save();

    // 6️⃣ Reward points
    const points = Math.floor(saved.payment.grandTotal / 100);
    const updatedCustomer = await CustomerService.addRewardPoints(saved.customer._id, points);
    const invoiceLink = pdfPath.publicUrl.publicUrl;

    await SmsService.sendInvoiceLink({
      customer,
      phone: customer.phone,
      invoiceId: saved._id,
      link: invoiceLink,
    });
    res.status(201).json({
      message: "Invoice created successfully",
      invoice: saved,
      pdfPath,
      rewardPointsEarned: points,
      customerRewardPoints: updatedCustomer.rewardPoints,
    });
  } catch (err) {
    console.error("INVOICE_CREATE_ERR", err);
    res.status(500).json({ error: "Server error" });
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
