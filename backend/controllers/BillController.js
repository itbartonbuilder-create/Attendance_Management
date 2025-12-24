import Bill from "../models/BillModel.js";

export const createBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Bill file is required" });
    }

    const bill = await Bill.create({
      workName: req.body.workName,
      billNo: req.body.billNo,
      site: req.body.site,
      vendor: req.body.vendor, // 🔥
      sentTo: req.body.sentTo,
      amount: req.body.amount,
      billDate: req.body.billDate,
      billFile: req.file.filename,
    });

    res.status(201).json({
      success: true,
      msg: "Bill submitted successfully",
      bill,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
