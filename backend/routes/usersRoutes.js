import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import authMiddleware from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";

const router = express.Router();

router.post("/", authMiddleware, permit("admin"), async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email exists" });
    const hash = await bcrypt.hash(password, 10);
    const u = await User.create({ name, email, password: hash, role: role || "worker", managerId: managerId || null });
    res.status(201).json({ message: "User created", id: u._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role === "admin" || role === "senior") {
      const rows = await User.find().select("-password").sort({ role: -1, name: 1 });
      return res.json(rows);
    }
    if (role === "manager") {
      const rows = await User.find({ $or: [{ managerId: id }, { _id: id }] }).select("-password").sort({ name: 1 });
      return res.json(rows);
    }
    
    const row = await User.findById(id).select("-password");
    return res.json([row]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
