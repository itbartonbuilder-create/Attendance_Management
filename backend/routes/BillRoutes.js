import express from "express";
import Bill from "../models/BillModel.js";
import { createBill } from "../controllers/BillController.js";
import { uploadBill } from "../middleware/upload.js";

const router = express.Router();

// ================= CREATE BILL =================
router.post(
  "/create",
  uploadBill.single("billFile"),
  createBill
);

// ================= GET BILLS =================
router.get("/", async (req, res) => {
  try {
    const { role, userId, site } = req.query;
    let filter = {};

    if (role === "admin") {
      filter = {};
    } 
    else if (role === "manager") {
      if (!userId || !site) {
        return res.status(400).json({ message: "Manager id & site required" });
      }
      filter = { sentTo: userId, site };
    } 
    else if (role === "vendor") {
      if (!userId) {
        return res.status(400).json({ message: "Vendor id required" });
      }
      filter = { vendor: userId };
    }

    const bills = await Bill.find(filter)
      .sort({ billNo: -1 })
      .populate("vendor", "name companyName")
      .populate("sentTo", "name email");

    res.status(200).json(bills);
  } catch (error) {
    console.error("FETCH BILL ERROR ❌", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================= APPROVE / REJECT BILL =================
// ✅ CORRECT ROUTE (THIS FIXES 404)
router.put("/:billId/status", async (req, res) => {
  try {
    const { billId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    bill.status = status;
    await bill.save();

    res.status(200).json({
      message: `Bill ${status} successfully`,
      bill,
    });
  } catch (error) {
    console.error("STATUS UPDATE ERROR ❌", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
