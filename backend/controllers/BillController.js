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

      billFile: req.file.path,       // ✅ Cloudinary URL
      billFileId: req.file.filename, // ✅ Cloudinary public_id
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
