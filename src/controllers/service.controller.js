const ServiceService = require("../services/service.service");

exports.create = async (req, res) => {
  try {
    const service = await ServiceService.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    console.error("SERVICE_CREATE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const services = await ServiceService.getAll();
    res.json(services);
  } catch (err) {
    console.error("SERVICE_GET_ALL_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const service = await ServiceService.getById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    console.error("SERVICE_GET_ID_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await ServiceService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error("SERVICE_UPDATE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    await ServiceService.delete(req.params.id);
    res.json({ message: "Service deleted" });
  } catch (err) {
    console.error("SERVICE_DELETE_ERR", err);
    res.status(500).json({ error: "Server error" });
  }
};
