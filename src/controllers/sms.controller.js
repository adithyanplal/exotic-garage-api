const InvoiceService = require("../services/invoice.service");
const SmsService = require("../services/sms.service");

exports.sendInvoiceSMS = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Fetch invoice + customer
    const invoice = await InvoiceService.getById(invoiceId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const customer = invoice.customer;
    if (!customer.phone)
      return res.status(400).json({ error: "Customer phone number missing" });

    // Build invoice link
    const invoiceLink = `${process.env.FRONTEND_URL}/invoice/${invoiceId}`;

    // Send SMS
    const result = await SmsService.sendInvoiceLink({
      customer,
      phone: customer.phone,
      link: invoiceLink,
      invoiceId
    });

    if (!result.success)
      return res.status(500).json({ error: "SMS failed", details: result.error });

    res.json({
      message: "SMS sent successfully",
      providerResponse: result.response
    });

  } catch (err) {
    console.error("SMS_SEND_CONTROLLER_ERR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
