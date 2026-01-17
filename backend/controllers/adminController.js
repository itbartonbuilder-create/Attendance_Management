import Vendor from "../models/vendorModel.js";
import { sendApprovalMail } from "../utils/emailService.js";

export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.status === "approved") {
      return res.json({ message: "Vendor already approved" });
    }

    // 🔐 SAFE CODE GENERATION
    const lastVendor = await Vendor.findOne({
      vendorCode: { $ne: null },
    }).sort({ vendorCode: -1 });

    let nextNumber = 1;
    if (lastVendor?.vendorCode) {
      nextNumber = Number(lastVendor.vendorCode.replace("VND-", "")) + 1;
    }

    const newCode = `VND-${String(nextNumber).padStart(3, "0")}`;

    vendor.status = "approved";
    vendor.vendorCode = newCode;
    await vendor.save();

    await sendApprovalMail(vendor.email, vendor.name, newCode);

    res.json({
      message: "Vendor approved successfully",
      vendorCode: newCode,
    });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
