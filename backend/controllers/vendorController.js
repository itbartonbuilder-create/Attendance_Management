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

    const exists = await Vendor.findOne({
      $or: [{ email }, { contactNo }],
    });

    if (exists) {
      return res.status(400).json({ msg: "Vendor already exists" });
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
      status: "pending", // ✅ default
    });

    await sendPendingMail(email, name);

    res.status(201).json({
      msg: "Registered successfully. Approval pending.",
      vendor,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ================= LOGIN VENDOR ================= */
export const loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    if (vendor.status !== "approved") {
      return res
        .status(403)
        .json({ msg: "Approval pending. Please wait." });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    res.json({ msg: "Login successful", vendor });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ================= GET ALL VENDORS ================= */
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ msg: error.message });
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
      return res.json({
        message: "Vendor already approved",
        vendor,
      });
    }

    // ✅ generate vendor code
    const vendorCode = "VND-" + Math.floor(1000 + Math.random() * 9000);

    vendor.status = "approved";   // ✅ SINGLE SOURCE OF TRUTH
    vendor.vendorCode = vendorCode;

    await vendor.save();

    res.json({
      message: "Vendor approved successfully",
      vendor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Approval failed" });
  }
};
