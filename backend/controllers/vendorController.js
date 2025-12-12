import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";

export const registerVendor = async (req, res) => {
  try {
    const { name, companyName, contactNo, password } = req.body;

    if (!name || !contactNo || !password) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }

    const existingVendor = await Vendor.findOne({ contactNo });
    if (existingVendor) {
      return res.status(400).json({ msg: "Vendor already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const vendor = await Vendor.create({
      name,
      companyName,
      contactNo,
      password: hashedPass,
    });

    return res.status(201).json({
      msg: "Vendor registered successfully",
      user: {
        _id: vendor._id,
        name: vendor.name,
        companyName: vendor.companyName,
        contactNo: vendor.contactNo,
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server Error", error: err.message });
  }
};


export const loginVendor = async (req, res) => {
  try {
    const { name, contactNo } = req.body;

    if (!name || !contactNo) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const vendor = await Vendor.findOne({ contactNo });

    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

   
    if (vendor.name !== name) {
      return res.status(400).json({ msg: "Incorrect vendor name" });
    }

    return res.status(200).json({
      msg: "Login successful",
      user: {
        _id: vendor._id,
        name: vendor.name,
        companyName: vendor.companyName,
        contactNo: vendor.contactNo,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};
