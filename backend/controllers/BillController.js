import Bill from "../models/BillModel.js";

const generateBillNo = async () => {
  const lastBill = await Bill.findOne().sort({ billNo: -1 });

  if (!lastBill) {
    return 1;
  }

  return Number(lastBill.billNo) + 1;
};

export const createBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Bill file required" });
    }

    const billNo = await generateBillNo(); // ✅ 1,2,3,4

    const bill = await Bill.create({
      workName: req.body.workName,
      billNo,
      site: req.body.site,
      vendor: req.body.vendor,
      sentTo: req.body.sentTo,
      amount: req.body.amount,
      billDate: req.body.billDate,
     billFile: {
        url: req.file.path,
        public_id: req.file.filename,
        originalName: req.file.originalname, 
      },
      billFileId: req.file.filename,
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error("CREATE BILL ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
};
