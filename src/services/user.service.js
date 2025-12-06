const User = require("../models/User");

exports.findByEmail = (email) => User.findOne({ email });

exports.create = (data) => new User(data).save();
