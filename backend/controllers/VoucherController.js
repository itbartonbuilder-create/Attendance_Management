import Voucher from "../models/Voucher.js";

export const createVoucher = async (req, res) => {
  try {
    let { voucherNo, payableTo, particulars, paymentMode, screenshotUrl, amount, amountInWords, site, createdByName, createdByUserId } = req.body;

    if (!voucherNo) {      
      voucherNo = "VCH-" + Date.now(); 
    }

    const newVoucher = new Voucher({
      voucherNo,
      payableTo,
      particulars,
      paymentMode,
      screenshotUrl: screenshotUrl || "",
      amount,
      amountInWords,
      site,
      createdByName,
      createdByUserId
    });

    await newVoucher.save();
    
    return res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      data: newVoucher
    });

  } catch (error) {
    console.error("CREATE VOUCHER ERROR ❌", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


export const getNextVoucherNumber = async (req, res) => {
  try {
    const count = await Voucher.countDocuments();
    const nextNum = String(count + 1).padStart(2, "0");
    res.status(200).json({ nextVoucherNo: nextNum });
  } catch (error) {
    console.error("GET VOUCHER NUMBER ERROR ❌", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const getVouchers = async (req, res) => {
  try {
    const { role, userId, site } = req.query;
    let filter = {};

    
    if (role === "admin" || role === "manager" || role === "accountant") {
      if (!site) {
        return res.status(400).json({ message: `Site is required for ${role}` });
      }
      filter = { site };
    } 
   
    else if (role === "vendor" || role === "user") {
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      filter = { createdByUserId: userId };
    }

    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json(vouchers);
  } catch (error) {
    console.error("FETCH VOUCHER ERROR ❌", error);
    res.status(500).json({ message: "Server Error" });
  }
};
