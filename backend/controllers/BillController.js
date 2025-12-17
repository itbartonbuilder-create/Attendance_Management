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
    console.error("Bill Error:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

