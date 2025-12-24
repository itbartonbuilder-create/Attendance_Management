import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";

export const registerVendor = async (req, res) => {
  try {
    const {
      name,
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
      !contactNo ||
      !aadharNumber ||
      !panNumber ||
      !vendorType ||
      !category ||
      !password
    ) {
      return res.status(400).json({ msg: "All required fields must be filled" });
    }

    const existingVendor = await Vendor.findOne({ contactNo });
    if (existingVendor) {
      return res.status(400).json({ msg: "Vendor already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const vendor = await Vendor.create({
      name,
      companyName,
      contactNo,
      aadharNumber,
      panNumber,
      vendorType,
      category,
      gstNumber,
      password: hashedPassword,
    });

    res.status(201).json({
      msg: "Vendor registered successfully",
      user: vendor,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const loginVendor = async (req, res) => {
  try {
    const { name, contactNo } = req.body;

    const vendor = await Vendor.findOne({ name, contactNo });
    if (!vendor) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    res.json({
      msg: "Login successful",
      user: vendor,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
