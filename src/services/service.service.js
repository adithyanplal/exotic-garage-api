const Service = require("../models/Service");

exports.create = (data) => new Service(data).save();
exports.getAll = () => Service.find();
exports.getById = (id) => Service.findById(id);
exports.update = (id, data) => Service.findByIdAndUpdate(id, data, { new: true });
exports.delete = (id) => Service.findByIdAndDelete(id);
