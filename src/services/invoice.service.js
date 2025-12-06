const Invoice = require("../models/Invoice");

const InvoiceService = {
  create: async (data) => {
    const invoice = new Invoice(data);
    return invoice.save();
  },

  getAll: async () => Invoice.find().populate("customer"),

  getById: async (id) => Invoice.findById(id).populate("customer"),

  delete: async (id) => Invoice.findByIdAndDelete(id),
};

module.exports = InvoiceService;
