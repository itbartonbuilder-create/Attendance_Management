import express from "express";
import mongoose from "mongoose";
import Bill from "../models/BillModel.js";
import { createBill } from "../controllers/BillController.js";
import { uploadBill } from "../middleware/upload.js";

const router = express.Router();

router.post("/create", uploadBill.single("billFile"), createBill);


router.get("/", async (req, res) => {
  try {
    const { role, site, manager, vendor } = req.query;
    let filter = {};

    if (role === "manager") {
      if (site) filter.site = site;
      if (manager && mongoose.Types.ObjectId.isValid(manager)) {
        filter.sentTo = manager;
      }
    }

    if (role === "vendor") {
      if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
        filter.vendor = vendor;
      }
    }

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("sentTo", "name email")
      .populate("vendor", "name companyName contactNo");

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
