import Bill from "../models/BillModel.js";

const generateBillNo = async () => {
  const lastBill = await Bill.findOne().sort({ billNo: -1 });
  return lastBill ? lastBill.billNo + 1 : 1;
};

export const createBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Bill file required" });
    }

    const {
      workName,
      site,
      vendor,
      sentTo,
      price,
      quantity,
      gstType,
      gstPercent,
      billDate,
    } = req.body;


    const subtotal = Number(price) * Number(quantity);

    let gstAmount = 0;
    let totalAmount = subtotal;

    if (gstType === "gst") {
      gstAmount = (subtotal * Number(gstPercent)) / 100;
      totalAmount = subtotal + gstAmount;
    }

    const billNo = await generateBillNo();

    const bill = await Bill.create({
      workName,
      billNo,
      site,
      vendor,
      sentTo,
      price,
      quantity,
      gstType,
      gstPercent: gstType === "gst" ? gstPercent : 0,
      gstAmount,
      totalAmount,

      billDate,
      billFile: req.file.path,
      billFileId: req.file.filename,
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error("CREATE BILL ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
};
