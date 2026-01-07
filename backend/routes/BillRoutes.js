import express from "express";
import Bill from "../models/BillModel.js";
import { createBill } from "../controllers/BillController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* CREATE */
router.post("/create", upload.single("billFile"), createBill);

/* GET */
router.get("/", async (req, res) => {
  try {
    const { role, userId, site } = req.query;
    let filter = {};

    /* ADMIN */
    if (role === "admin") {
      filter = {};
    }

    /* MANAGER */
    else if (role === "manager") {
      if (!userId || !site) {
        return res.status(400).json({ message: "Manager id & site required" });
      }

      filter = {
        sentTo: userId,
        site,
      };
    }

    /* VENDOR */
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

export default router;
