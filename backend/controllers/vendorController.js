import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";
import {
  sendPendingMail,
  sendApprovalMail,
} from "../utils/emailService.js";

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
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */
export const loginVendor = async (req, res) => {
  try {
    const { contactNo, password } = req.body;

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

/* ================= APPROVE ================= */
export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    if (vendor.status === "approved") {
      return res.json({ message: "Vendor already approved" });
    }

    const lastVendor = await Vendor.findOne({
      vendorCode: { $ne: null },
    }).sort({ vendorCode: -1 });

    let newCode = "001";
    if (lastVendor?.vendorCode) {
      newCode = String(Number(lastVendor.vendorCode) + 1).padStart(3, "0");
    }

    vendor.status = "approved";
    vendor.vendorCode = newCode;
    await vendor.save();

    await sendApprovalMail(vendor.email, vendor.name, newCode);

    res.json({
      message: "Vendor approved successfully",
      vendorCode: newCode,
    });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
