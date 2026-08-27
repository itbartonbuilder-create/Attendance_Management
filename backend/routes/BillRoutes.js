import express from "express";
import Bill from "../models/BillModel.js";
import Voucher from "../models/Voucher.js"; // Voucher model import kiya
import { createBill } from "../controllers/BillController.js";
import { uploadBill } from "../middleware/upload.js";

const router = express.Router();


router.post(
  "/create",
  uploadBill.single("billFile"),
  createBill
);


router.get("/", async (req, res) => {
  try {
    const { role, userId, site } = req.query;
    let billFilter = {};
    let voucherFilter = {};

    if (role === "admin" || role === "manager" || role === "accountant") {
      if (!site) {
        return res.status(400).json({ message: "Site required" });
      }
      billFilter = { site };
      voucherFilter = { site };
    } else if (role === "vendor") {
      if (!userId) {
        return res.status(400).json({ message: "Vendor id required" });
      }
      billFilter = { vendor: userId };
      voucherFilter = { createdByUserId: userId };
    }

  
    const [bills, vouchers] = await Promise.all([
      Bill.find(billFilter)
        .sort({ createdAt: -1 })
        .populate("vendor", "name companyName")
        .populate("sentTo", "name email")
        .lean(),
      Voucher.find(voucherFilter)
        .sort({ createdAt: -1 })
        .lean()
    ]);


  const formattedVouchers = vouchers.map((v) => ({
  _id: v._id,
  site: v.site,                  
  createdByName: v.createdByName, 
  workName: v.particulars,
  billNo: v.voucherNo,
  amount: v.amount,
  quantity: 1,
  gstType: "non-gst",
  gstPercent: 0,
  totalAmount: v.amount,
      paymentMode: v.paymentMode,
 billDate: v.voucherDate || v.createdAt,
  billFile: v.screenshotUrl,
  vendor: { name: v.payableTo },
  status: "approved",
  isVoucher: true
}));

   
  const parseDate = (date) => {
  if (!date) return 0;

 
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00`).getTime();
  }

 
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [day, month, year] = date.split("/");

    return new Date(
      `${year}-${month}-${day}T00:00:00`
    ).getTime();
  }

  const parsed = new Date(date).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

const combinedHistory = [...bills, ...formattedVouchers].sort(
  (a, b) => {
    const dateA = parseDate(a.billDate || a.createdAt);
    const dateB = parseDate(b.billDate || b.createdAt);

    return dateB - dateA;
  }
);

    res.status(200).json(combinedHistory);
  } catch (error) {
    console.error("FETCH BILL & VOUCHER ERROR ❌", error);
    res.status(500).json({ message: "Server Error" });
  }
});

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
