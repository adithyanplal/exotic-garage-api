const CustomerService = require("../services/customer.service");
const Invoice = require("../models/Invoice");
exports.create = async (req, res) => {
  try {
    const customer = await CustomerService.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    console.error("CUSTOMER_CREATE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getByVehicle = async (req, res) => {
  try {
    const vehicleNo = req.params.vehicleNo;

    // 1️⃣ Find customer with this vehicle number
    const customer = await CustomerService.getByVehicleNo(vehicleNo);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // 2️⃣ Find all invoices for this vehicle
    const services = await Invoice.find({ "customer.vehicleNo": vehicleNo })
      .sort({ createdAt: -1 }) // latest first
      .select("createdAt invoiceNo payment.items pdfPath") // select needed fields
      .lean();

    // Map invoices to service entries
    const serviceEntries = services.map((inv) => ({
      _id: inv._id,
      date: inv.createdAt,
      description: inv.items.map((i) => i.name).join(", "),
      invoiceNo: inv.invoiceNo,
      cost: inv.payment.grandTotal,
      pdfPath: inv.pdfPath,
    }));

    res.json({ customer, services: serviceEntries });
  } catch (err) {
    console.error("CUSTOMER_VEHICLE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const customers = await CustomerService.getAll();
    res.json(customers);
  } catch (err) {
    console.error("CUSTOMER_GET_ALL_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const customer = await CustomerService.getById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Not found" });
    res.json(customer);
  } catch (err) {
    console.error("CUSTOMER_GET_ID_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await CustomerService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error("CUSTOMER_UPDATE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    await CustomerService.delete(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error("CUSTOMER_DELETE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};
