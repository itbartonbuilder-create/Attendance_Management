import express from "express";
import mongoose from "mongoose";
import Bill from "../models/BillModel.js";
import { createBill } from "../controllers/BillController.js";
import { upload } from "../middleware/upload.js"; // ✅ FIXED

const router = express.Router();

/* ================= CREATE BILL ================= */
router.post(
  "/create",
  upload.single("billFile"), // ✅ name must match frontend
  createBill
);

/* ================= GET BILLS ================= */
router.get("/", async (req, res) => {
  try {
    const { role, site, manager, vendor } = req.query;

    let filter = {};

    /* ========= ADMIN → ALL BILLS ========= */
    if (role === "admin") {
      filter = {}; // no filter
    }

    /* ========= MANAGER ========= */
    else if (role === "manager") {
      if (!site) {
        return res.status(400).json({ message: "Site required" });
      }

      filter.site = site;

      if (manager && mongoose.Types.ObjectId.isValid(manager)) {
        filter.sentTo = manager;
      }
    }

    /* ========= VENDOR ========= */
    else if (role === "vendor") {
      if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
        filter.vendor = vendor;
      }
    }

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("vendor", "name companyName")
      .populate("sentTo", "name email");

    res.status(200).json(bills);
  } catch (error) {
    console.error("❌ Bill fetch error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
