import express from "express";
import mongoose from "mongoose";
import Bill from "../models/BillModel.js";
import "../models/User.js";
import { createBill } from "../controllers/BillController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();


router.post("/create", upload.single("billFile"), createBill);

router.get("/", async (req, res) => {
  try {
    const { role, site, manager } = req.query;
    let filter = {};

    // Manager filter
    if (role === "manager") {
      if (site) filter.site = site;
      if (manager && mongoose.Types.ObjectId.isValid(manager)) {
        filter.sentTo = mongoose.Types.ObjectId(manager);
      }
    }

    // Fetch bills and populate manager name
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("sentTo", "name"); // simple and works reliably

    res.status(200).json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
