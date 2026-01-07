import Bill from "../models/BillModel.js";

export const createBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Bill file required" });
    }

    const bill = await Bill.create({
      workName: req.body.workName,
      billNo: req.body.billNo,
      site: req.body.site,
      vendor: req.body.vendor,
      sentTo: req.body.sentTo,
      amount: req.body.amount,
      billDate: req.body.billDate,
      billFile: req.file.path,
      billFileId: req.file.filename,
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error("CREATE BILL ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
};
