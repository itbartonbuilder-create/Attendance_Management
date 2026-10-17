
import Voucher from "../models/Voucher.js";

export const createVoucher = async (req, res) => {
  try {
    const {
      voucherNo,
      voucherDate,
      payableTo,
      particulars,
      paymentMode,
      amount,
      amountInWords,
      site,
      createdByName,
      createdByUserId,
    } = req.body;

    const screenshotUrl = req.file
      ? req.file.path
      : (req.body.screenshotUrl || "");

    const requiredFields = {
      voucherDate,
      payableTo,
      particulars,
      paymentMode,
      amount,
      amountInWords,
      site,
      createdByName,
      createdByUserId,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) =>
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        missingFields,
      });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number greater than zero",
      });
    }

    const finalSite = String(site).trim();
    const finalVoucherNo =
      String(voucherNo || "").trim() || `VCH-${Date.now()}`;

    // Save voucher
    const newVoucher = new Voucher({
      voucherNo: finalVoucherNo,
      voucherDate,
      payableTo: String(payableTo).trim(),
      particulars: String(particulars).trim(),
      paymentMode,
      screenshotUrl,
      amount: parsedAmount,
      amountInWords,
      site: finalSite,
      createdByName,
      createdByUserId,
    });

    await newVoucher.save();

    return res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      data: newVoucher,
    });
  } catch (error) {
    console.error("CREATE VOUCHER ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This voucher number already exists for this site. Please refresh the voucher number and try again.",
        error: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Voucher validation failed",
        errors: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getNextVoucherNumber = async (req, res) => {
  try {
    const site = String(req.query.site || "").trim();

    if (!site) {
      return res.status(400).json({
        success: false,
        message: "Site is required to generate voucher number",
      });
    }

    const vouchers = await Voucher.find({
      site,
      voucherNo: { $exists: true, $ne: "" },
    })
      .select("voucherNo")
      .lean();

    let maxNumber = 0;

    for (const voucher of vouchers) {
    
      const match = String(voucher.voucherNo).match(
        /^(?:VCH-)?(\d+)$/
      );

      if (match) {
        const number = Number(match[1]);

        if (
          Number.isSafeInteger(number) &&
          number > maxNumber
        ) {
          maxNumber = number;
        }
      }
    }

    const nextVoucherNo = String(maxNumber + 1).padStart(2, "0");

    return res.status(200).json({
      success: true,
      site,
      nextVoucherNo,
    });
  } catch (error) {
    console.error("GET VOUCHER NUMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to generate voucher number",
    });
  }
};

export const getVouchers = async (req, res) => {
  try {
    const { role, userId, site } = req.query;
    let filter = {};

    if (["admin", "manager", "accountant"].includes(role)) {
      if (!site) {
        return res.status(400).json({
          success: false,
          message: `Site is required for ${role}`,
        });
      }

      filter = { site: String(site).trim() };
    } else if (["vendor", "user"].includes(role)) {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID required",
        });
      }

      filter = { createdByUserId: userId };
    }

    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json(vouchers);
  } catch (error) {
    console.error("FETCH VOUCHER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch vouchers",
    });
  }
};
