import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";
import { sendPendingMail, sendApprovalMail } from "../utils/emailService.js";

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

    if (!name || !email || !contactNo || !password) {
      return res.status(400).json({ msg: "Required fields missing" });
    }

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
      status: "pending",
    });

    // 📧 mail to vendor
    await sendPendingMail(email, name);

    res.status(201).json({
      msg: "Registered successfully. Approval pending.",
      vendor,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ================= LOGIN ================= */
export const loginVendor = async (req, res) => {
  try {
    const { contactNo, password } = req.body;

    if (!contactNo || !password) {
      return res.status(400).json({ msg: "Contact number and password required" });
    }

    const vendor = await Vendor.findOne({ contactNo });
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    if (vendor.status !== "approved") {
      return res.status(403).json({ msg: "Approval pending" });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    res.json({
      msg: "Login successful",
      vendor,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ================= GET ALL VENDORS ================= */
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ================= APPROVE ================= */
export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    if (vendor.status === "approved") {
      return res.json({ msg: "Already approved" });
    }

    vendor.status = "approved";
    vendor.vendorCode = "VND-" + Math.floor(1000 + Math.random() * 9000);
    await vendor.save();

    // 📧 approval mail
    await sendApprovalMail(vendor.email, vendor.name, vendor.vendorCode);

    res.json({ msg: "Vendor approved successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
