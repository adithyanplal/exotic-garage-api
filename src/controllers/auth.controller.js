const UserService = require("../services/user.service");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await UserService.findByEmail(email);
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await UserService.create({ name, email, password: hash, role: role || "user" });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("REGISTER_ERR", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Return user details safely (exclude password)
    const userDetails = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({ message: "Login successful", token, user: userDetails });
  } catch (err) {
    console.error("LOGIN_ERR", err);
    res.status(500).json({ message: "Server error" });
  }
};
