const SmsLog = require("../models/SMSLogs");
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

const SmsService = {
  sendInvoiceLink: async ({ customer, phone, invoiceId, link }) => {
  const messageText = `
Hello ${customer.name},
Your invoice is ready.

✨ Exotic Garage Anchal — Luxury Care for Your Wheels

🔗 View your invoice:
${link}

Thank you for choosing us.
We appreciate your business!

📍 Near Shri Alappan Nada Temple, Alayamon, Anchal
📞 9747333493 / 9188112664
📧 info@exoticgarage.in

`;


    try {
      // ---- SEND SMS ----
      const response = await client.messages.create({
        body: messageText,
        to: phone,
        from: process.env.TWILIO_PHONE,
      });

      // ---- SAVE SAFE SUCCESS LOG ----
      await SmsLog.create({
        customer: customer._id,
        phone,
        message: messageText,
        status: "SENT",
        providerMessageId: response.sid,
        providerStatus: response.status,
        invoiceId,
      });

      return { success: true, sid: response.sid };
    } catch (err) {
      console.error("TWILIO_SMS_ERROR:", err.message);

      // ---- SAVE SAFE FAILED LOG ----
      await SmsLog.create({
        customer: customer._id,
        phone,
        message: messageText,
        status: "FAILED",
        providerMessageId: err.code || null,
        providerStatus: err.message || "Unknown Error",
        invoiceId,
      });

      return { success: false, error: err.message };
    }
  }
};

module.exports = SmsService;
