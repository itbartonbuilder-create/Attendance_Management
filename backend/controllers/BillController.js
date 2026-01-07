import Bill from "../models/BillModel.js";

const generateBillNo = async () => {
  const lastBill = await Bill.findOne().sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastBill && lastBill.billNo) {
    const lastNo = parseInt(lastBill.billNo.split("-")[1]);
    nextNumber = lastNo + 1;
  }

  return `BILL-${String(nextNumber).padStart(4, "0")}`;
};

export const createBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Bill file required" });
    }

    const billNo = await generateBillNo();

    const bill = await Bill.create({
      workName: req.body.workName,
      billNo,
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
