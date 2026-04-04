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

    const { site, vendor, sentTo, billDate } = req.body;
    const items = JSON.parse(req.body.items); 

    let billSubtotal = 0;
    let billGSTTotal = 0;

    const processedItems = items.map((item) => {
      const amount = item.quantity * item.rate;
      const gstAmount = (amount * item.gstPercent) / 100;
      const total = amount + gstAmount;

      billSubtotal += amount;
      billGSTTotal += gstAmount;

      return {
        itemName: item.itemName,
        quantity: item.quantity,
        rate: item.rate,
        amount,
        gstPercent: item.gstPercent,
        gstAmount,
        total,
      };
    });

    const billGrandTotal = billSubtotal + billGSTTotal;
    const billNo = await generateBillNo();

    const bill = await Bill.create({
      billNo,
      site,
      vendor,
      sentTo,
      items: processedItems,
      billSubtotal,
      billGSTTotal,
      billGrandTotal,
      billDate,
      billFile: req.file.path,
      billFileId: req.file.filename,
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
