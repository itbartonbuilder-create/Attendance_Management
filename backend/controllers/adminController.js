import Vendor from "../models/vendorModel.js";
import { sendApprovalMail } from "../utils/emailService.js";

export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

    const lastVendor = await Vendor.findOne({ vendorCode: { $ne: null } })
      .sort({ vendorCode: -1 });

    const newCode = lastVendor
      ? String(Number(lastVendor.vendorCode) + 1).padStart(3, "0")
      : "001";

    vendor.status = "approved";
    vendor.vendorCode = newCode;
    await vendor.save();

    await sendApprovalMail(vendor.email, vendor.name, newCode);

    res.json({ msg: "Vendor approved successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
