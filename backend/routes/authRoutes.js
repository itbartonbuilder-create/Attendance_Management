import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Worker from "../models/Worker.js";

dotenv.config();
const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password, name, contactNo } = req.body;

  try {
   
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
      return res.json({
        msg: "Admin login successful",
        token,
        user: { name: "Admin", email, role: "admin" },
      });
    }


    if (email === process.env.MANAGER_EMAIL && password === process.env.MANAGER_PASSWORD) {
      const token = jwt.sign({ role: "manager" }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
      return res.json({
        msg: "Manager login successful",
        token,
        user: { name: "Manager", email, role: "manager" },
      });
    }

   
    if (name && contactNo) {
      const worker = await Worker.findOne({ name, contactNo });
      if (!worker) return res.status(404).json({ msg: "Worker not found" });

      const token = jwt.sign({ id: worker._id, role: "worker" }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return res.json({
        msg: "Worker login successful",
        token,
        user: { _id: worker._id, name: worker.name, role: "worker", site: worker.site },
      });
    }

    return res.status(400).json({ msg: "Invalid login credentials" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
