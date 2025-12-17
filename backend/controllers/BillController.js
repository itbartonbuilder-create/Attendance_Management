
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
      managerId: req.body.managerId,
      amount: req.body.amount,
      billDate: req.body.billDate,
      billFile: req.file.filename,
    });

    res.status(201).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


export const getBillsByManager = async (req, res) => {
  try {
    const bills = await Bill.find({ managerId: req.params.managerId });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

