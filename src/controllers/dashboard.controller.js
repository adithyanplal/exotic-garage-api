const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const { invoice } = require("../config/settings");

exports.getAnalytics = async (req, res) => {
  try {
    // 1️⃣ Total revenue
    const revenueAgg = await Invoice.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$payment.grandTotal" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // 2️⃣ Total invoices
    const totalInvoices = await Invoice.countDocuments();

    // 3️⃣ Total customers
    const totalCustomers = await Customer.countDocuments();

    // 4️⃣ Total reward points distributed
    const rewardPointsAgg = await Customer.aggregate([
      { $group: { _id: null, totalRewardPoints: { $sum: "$rewardPoints" } } },
    ]);
    const totalRewardPoints = rewardPointsAgg[0]?.totalRewardPoints || 0;

    // 5️⃣ Monthly revenue (last 12 months)
    const monthlyRevenue = await Invoice.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$payment.grandTotal" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // 6️⃣ Latest 5 invoices
    const latestInvoices = await Invoice.find()
      .sort({ invoiceDate: -1 })
      .limit(5)
      .populate("customer") // Optional: populate customer info if needed
      .lean(); // convert to plain JS object

    res.json({
      totalRevenue,
      totalInvoices,
      totalCustomers,
      totalRewardPoints,
      monthlyRevenue,
      latestInvoices, // 🆕 added latest 5 invoices
    });
  } catch (err) {
    console.error("DASHBOARD_ANALYTICS_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};
