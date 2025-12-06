require("dotenv").config();

const settings = {
  // --------------------
  // EMAIL CONFIGURATION
  // --------------------
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || ""
    },
    from: process.env.EMAIL_FROM || "noreply@exoticgarage.com"
  },

  // --------------------
  // SMS CONFIGURATION
  // --------------------
  sms: {
    provider: process.env.SMS_PROVIDER || "twilio",
    accountSid: process.env.SMS_ACCOUNT_SID || "",
    authToken: process.env.SMS_AUTH_TOKEN || "",
    fromNumber: process.env.SMS_FROM || "+10000000000"
  },

  // --------------------
  // WHATSAPP CONFIGURATION
  // --------------------
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || "twilio",
    accountSid: process.env.WHATSAPP_ACCOUNT_SID || "",
    authToken: process.env.WHATSAPP_AUTH_TOKEN || "",
    fromNumber: process.env.WHATSAPP_FROM || "whatsapp:+10000000000"
  },

  // --------------------
  // INVOICE CONFIGURATION
  // --------------------
  invoice: {
    companyName: process.env.INVOICE_COMPANY_NAME || "EXOTIC GARAGE ANCHAL",
    tagline: process.env.INVOICE_TAGLINE || "Luxury Care For Your Wheels",
    address:
      process.env.INVOICE_ADDRESS ||
      "Near Shri Alappan Nada Temple, Alayamon, Anchal, Pin 691306, Kollam Kerala",
    phone: process.env.INVOICE_PHONE || "9747333493, 9188112664",
    email: process.env.INVOICE_EMAIL || "info@exoticgarage.com",
    logoUrl:
      process.env.INVOICE_LOGO_URL ||
      "http://localhost:5000/public/assets/constants/exotic-garage-logo.png",
    signatureName:
      process.env.INVOICE_SIGNATURE_NAME || "Authorized Signature",
    invoicePrefix: process.env.INVOICE_PREFIX || "EXGAR", // EXGAR-0001
    startingNumber: parseInt(process.env.INVOICE_STARTING_NUMBER || "1000")
  },

  // --------------------
  // GST CONFIGURATION
  // --------------------
  tax: {
    gstRate: parseFloat(process.env.GST_RATE || 0.18) // 18%
  },

  // --------------------
  // REWARD POINTS CONFIGURATION
  // --------------------
  rewards: {
    enabled: process.env.REWARDS_ENABLED === "true",
    pointsPerCurrency: parseFloat(process.env.REWARDS_POINTS_PER_CURRENCY || 1) // 1 point per ₹1
  }
};

module.exports = settings;
