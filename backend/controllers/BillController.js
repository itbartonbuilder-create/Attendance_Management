import Bill from "../models/BillModel.js";

export const createBill = async (req, res) => {
  try {
    // ❌ bill file missing
    if (!req.file) {
      return res.status(400).json({ message: "Bill file required" });
    }

    // 🔥 STEP 1: LAST BILL FIND
    const lastBill = await Bill.findOne().sort({ createdAt: -1 });

    let nextBillNo = "1A";

    if (lastBill && lastBill.billNo) {
      // Extract number from "12A"
      const lastNumber = parseInt(lastBill.billNo.replace("A", ""));
      nextBillNo = `${lastNumber + 1}A`;
    }

    // 🔥 STEP 2: CREATE BILL
    const bill = await Bill.create({
      workName: req.body.workName,
      billNo: nextBillNo, // ⭐ AUTO GENERATED
      site: req.body.site,
      vendor: req.body.vendor,
      sentTo: req.body.sentTo,
      amount: req.body.amount,
      billDate: req.body.billDate,

      billFile: req.file.path,       // Cloudinary URL
      billFileId: req.file.filename, // Cloudinary public_id
    });

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      bill,
    });
  } catch (err) {
    console.error("CREATE BILL ERROR ❌", err);

    // Duplicate billNo safety
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Bill number already exists, please retry",
      });
    }

    res.status(500).json({ message: err.message });
  }
};
