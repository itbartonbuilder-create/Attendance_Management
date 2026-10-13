
import Vendor from "../models/vendorModel.js";
import { sendApprovalMail } from "../utils/emailService.js";

export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    if (vendor.status === "approved") {
      return res.json({
        message: "Vendor already approved",
        vendorCode: vendor.vendorCode,
      });
    }

    const existingVendors = await Vendor.find({
      vendorCode: { $regex: /^VND-\d+$/ },
    }).select("vendorCode");

    let maxNumber = 0;

    for (const item of existingVendors) {
      const number = Number(
        item.vendorCode.replace("VND-", "")
      );

      if (Number.isFinite(number) && number > maxNumber) {
        maxNumber = number;
      }
    }

    const newCode = `VND-${String(maxNumber + 1).padStart(3, "0")}`;

    vendor.status = "approved";
    vendor.vendorCode = newCode;

    await vendor.save();

    let emailSent = true;

    try {
      await sendApprovalMail(
        vendor.email,
        vendor.name,
        newCode
      );
    } catch (mailError) {
      emailSent = false;
      console.error(
        "Vendor approved, but approval email failed:",
        mailError
      );
    }

    return res.status(200).json({
      message: emailSent
        ? "Vendor approved successfully"
        : "Vendor approved successfully, but email could not be sent",
      vendorCode: newCode,
      emailSent,
    });
  } catch (err) {
    console.error("Approve Vendor Error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
