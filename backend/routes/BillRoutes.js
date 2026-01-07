import express from "express";
import mongoose from "mongoose";
import Bill from "../models/BillModel.js";
import { createBill } from "../controllers/BillController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* CREATE BILL */
router.post("/create", upload.single("billFile"), createBill);

/* GET BILLS */
router.get("/", async (req, res) => {
  try {
    const { role, site, manager, vendor } = req.query;
    let filter = {};

    if (role === "admin") {
      filter = {};
    } 
    else if (role === "manager") {
      filter.site = site;
      if (manager) filter.sentTo = manager;
    } 
    else if (role === "vendor") {
      filter.vendor = vendor;
    }

    const bills = await Bill.find(filter)
      .sort({ billNo: -1 })
      .populate("vendor", "name companyName")
      .populate("sentTo", "name email");

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
