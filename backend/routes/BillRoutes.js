import express from "express";
import mongoose from "mongoose";
import Bill from "../models/BillModel.js";
import { createBill } from "../controllers/BillController.js";
import { uploadBill } from "../middleware/upload.js";

const router = express.Router();

/* ========== CREATE BILL (VENDOR) ========== */
router.post("/create", uploadBill.single("billFile"), createBill);

/* ========== GET BILLS (ADMIN / MANAGER / VENDOR) ========== */
router.get("/", async (req, res) => {
  try {
    const { role, site, manager, vendor } = req.query;
    let filter = {};

    // ✅ ADMIN → ALL BILLS
    if (!role || role === "admin") {
      filter = {};
    }

    // ✅ MANAGER
    if (role === "manager") {
      if (site) filter.site = site;
      if (manager && mongoose.Types.ObjectId.isValid(manager)) {
        filter.sentTo = manager;
      }
    }

    // ✅ VENDOR
    if (role === "vendor") {
      if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
        filter.vendor = vendor;
      }
    }

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("vendor", "name companyName contactNo")
      .populate("sentTo", "name");

    res.json(bills);
  } catch (err) {
    console.error("FETCH BILL ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
