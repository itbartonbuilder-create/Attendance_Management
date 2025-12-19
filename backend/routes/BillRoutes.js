import express from "express";
import Bill from "../models/BillModel.js";
import { createBill } from "../controllers/BillController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/create", upload.single("billFile"), createBill);

router.get("/", async (req, res) => {
  try {
    const { role, site, manager } = req.query;
    let filter = {};

    if (role === "manager") {
      filter.site = site;
      filter.sentTo = manager;
    }

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("sentTo", "name"); 

    res.status(200).json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ message: "Error fetching bills" });
  }
});

export default router;
