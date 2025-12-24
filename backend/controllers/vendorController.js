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
      return res.status(400).json({
        msg: "All required fields must be filled",
      });
    }

    const existingVendor = await Vendor.findOne({ contactNo });
    if (existingVendor) {
      return res.status(400).json({
        msg: "Vendor already registered",
      });
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
      role: "vendor",
    });

    res.status(201).json({
      msg: "Vendor registered successfully",
      user: {
        _id: vendor._id,
        name: vendor.name,
        role: vendor.role,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const loginVendor = async (req, res) => {
  try {
    const { contactNo } = req.body;

    if (!contactNo ) {
      return res.status(400).json({
        msg: "Contact number",
      });
    }

    const vendor = await Vendor.findOne({ contactNo });
    if (!vendor) {
      return res.status(401).json({
        msg: "Vendor not found",
      });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid credentials",
      });
    }

    res.json({
      msg: "Login successful",
      user: {
        _id: vendor._id,
        name: vendor.name,
        role: vendor.role,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().select("-password");
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
