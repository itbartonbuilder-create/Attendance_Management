import Bill from "../models/BillModel.js";

export const createBill = async (req, res) => {
  const bill = await Bill.create({
    ...req.body,
    billFile: req.file.filename,
  });

  res.json({ msg: "Bill submitted", bill });
};
