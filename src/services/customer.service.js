const Customer = require("../models/Customer");

const CustomerService = {
  create: async (data) => {
    const customer = new Customer(data);
    return customer.save();
  },

  getAll: async () => Customer.find(),

  getById: async (id) => Customer.findById(id),

  getByVehicleNumber: async (vehicleNo) => {
    // Returns a lean object for faster queries
    return await Customer.findOne({ vehicleNo }).lean();
  },

  update: async (id, data) => Customer.findByIdAndUpdate(id, data, { new: true }),

  delete: async (id) => Customer.findByIdAndDelete(id),

  addRewardPoints: async (customerId, points) =>
    Customer.findByIdAndUpdate(customerId, { $inc: { rewardPoints: points } }, { new: true }),
};

module.exports = CustomerService;
