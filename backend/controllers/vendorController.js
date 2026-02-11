import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";
import axios from "axios";

import { sendPendingMail } from "../utils/emailService.js";

/* ================= REGISTER ================= */
export const registerVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      companyName,
      contactNo,
      aadharNumber,
      panNumber,
      vendorType,
      category,
      gstNumber,
      password,
    } = req.body;

    if (
      !name ||
      !email ||
      !contactNo ||
      !password ||
      !aadharNumber ||
      !panNumber ||
      !vendorType ||
      !category
    ) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const exists = await Vendor.findOne({
      $or: [{ email }, { contactNo }],
    });
    if (exists) {
      return res.status(400).json({ message: "Vendor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const vendor = await Vendor.create({
      name,
      email,
      companyName,
      contactNo,
      aadharNumber,
      panNumber,
      vendorType,
      category,
      gstNumber,
      password: hashedPassword,
      status: "pending",
      vendorCode: null,
    });

    await sendPendingMail(email, name);

    res.status(201).json({
      message: "Registered successfully. Approval pending.",
      vendor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */
export const loginVendor = async (req, res) => {
  try {
    const { contactNo, password,captchaToken } = req.body;

    if (!captchaToken) {
      return res.status(400).json({ message: "Captcha token missing" });
    }

    // 🔐 Verify Captcha
    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";

    const captchaRes = await axios.post(
      verifyURL,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!captchaRes.data.success) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }


    const vendor = await Vendor.findOne({ contactNo });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    if (vendor.status !== "approved") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", vendor });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL ================= */
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
