import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";
import {
  sendPendingMail,
  sendApprovalMail,
} from "../utils/emailService.js";

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

    // 🔎 Validation
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

    // 🔎 Check existing vendor
    const exists = await Vendor.findOne({
      $or: [{ email }, { contactNo }],
    });

    if (exists) {
      return res.status(400).json({
        message: "Vendor already exists",
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 💾 Save vendor
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

    // 📧 SEND MAIL FIRST (IMPORTANT)
    await sendPendingMail(email, name);

    // ✅ Then respond
    res.status(201).json({
      message: "Registered successfully. Approval pending.",
      vendor,
    });
  } catch (err) {
    console.error("Register vendor error:", err);
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL VENDORS ================= */
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= APPROVE VENDOR ================= */
export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.status === "approved") {
      return res.json({ message: "Vendor already approved" });
    }

    // 🔢 Generate vendor code
    const lastVendor = await Vendor.findOne({ vendorCode: { $ne: null } })
      .sort({ vendorCode: -1 });

    const newCode = lastVendor
      ? String(Number(lastVendor.vendorCode) + 1).padStart(3, "0")
      : "001";

    vendor.status = "approved";
    vendor.vendorCode = newCode;
    await vendor.save();

    // 📧 SEND APPROVAL MAIL (await mandatory)
    await sendApprovalMail(vendor.email, vendor.name, newCode);

    res.json({ message: "Vendor approved successfully" });
  } catch (err) {
    console.error("Approve vendor error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
