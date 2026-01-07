import Bill from "../models/BillModel.js";

export const createBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Bill file missing" });
    }

    // 🔢 GET LAST BILL
    const lastBill = await Bill.findOne().sort({ createdAt: -1 });

    let nextBillNo = 1;

    if (lastBill && Number(lastBill.billNo)) {
      nextBillNo = Number(lastBill.billNo) + 1;
    }

    const bill = await Bill.create({
      workName: req.body.workName,
      billNo: String(nextBillNo), // ✅ 1,2,3
      site: req.body.site,
      vendor: req.body.vendor,
      sentTo: req.body.sentTo,
      amount: req.body.amount,
      billDate: req.body.billDate,
      billFile: req.file.path,
      billFileId: req.file.filename,
    });

    res.status(201).json(bill);
  } catch (error) {
    console.error("❌ BILL CREATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
