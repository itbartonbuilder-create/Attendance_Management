import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";
import { sendPendingMail } from "../utils/emailService.js";

/* ================= REGISTER VENDOR ================= */
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

    // ✅ Validation
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
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    // ✅ Check existing vendor
    const exists = await Vendor.findOne({
      $or: [{ email }, { contactNo }],
    });

    if (exists) {
      return res.status(400).json({
        message: "Vendor already exists",
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save vendor
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
    });

    // ✅ Send response FIRST
    res.status(201).json({
      message: "Registered successfully. Approval pending.",
      vendor,
    });

    // 📧 Send pending email (NON-BLOCKING)
    sendPendingMail(email, name).catch((err) => {
      console.error("❌ Pending email failed:", err.message);
    });

  } catch (err) {
    console.error("Register vendor error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= LOGIN VENDOR ================= */
export const loginVendor = async (req, res) => {
  try {
    const { contactNo, password } = req.body;

    if (!contactNo || !password) {
      return res.status(400).json({
        message: "Contact number and password required",
      });
    }

    const vendor = await Vendor.findOne({ contactNo });

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    // ⛔ Approval pending case (IMPORTANT)
    if (vendor.status !== "approved") {
      return res.status(403).json({
        message:
          "Your account is not approved yet. Please wait for admin approval.",
      });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    res.json({
      message: "Login successful",
      vendor,
    });

  } catch (err) {
    console.error("Vendor login error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    console.error("Get vendors error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
