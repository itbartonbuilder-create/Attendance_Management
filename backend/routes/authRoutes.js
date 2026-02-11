import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Worker from "../models/Worker.js";
import Manager from "../models/Manager.js"; 
import axios from "axios";

dotenv.config();
const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password, name, site, contactNo, captchaToken } = req.body;

  try {

    if (!captchaToken) {
      return res.status(400).json({ msg: "Captcha required" });
    }

    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";

    const captchaRes = await axios.post(
      verifyURL,
      {},
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!captchaRes.data.success) {
      return res.status(400).json({ msg: "Captcha verification failed" });
    }
    
    if (email && password) {
      if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
        return res.json({
          msg: "Admin login successful",
          token,
          user: { name: "Admin", email, role: "admin" },
        });
      } else {
        return res.status(400).json({ msg: "Invalid admin credentials" });
      }
    }

 
    if (site && contactNo) {
      const manager = await Manager.findOne({ site, contactNo });
      if (!manager) return res.status(404).json({ msg: "Manager not found" });

      const token = jwt.sign({ id: manager._id, role: "manager" }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return res.json({
        msg: "Manager login successful",
        token,
        user: { _id: manager._id, name: manager.name, role: "manager", site: manager.site },
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
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
