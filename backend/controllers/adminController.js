import Vendor from "../models/vendorModel.js";
import { sendApprovalMail } from "../utils/emailService.js";

export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.status === "approved") {
      return res.json({ message: "Already approved" });
    }

    vendor.status = "approved";
    vendor.vendorCode = "VND-" + Math.floor(1000 + Math.random() * 9000);
    await vendor.save();

    
    await sendApprovalMail(
      vendor.email,
      vendor.name,
      vendor.vendorCode
    );

    res.json({ message: "Vendor approved successfully" });
  } catch (err) {
    console.error("Approve vendor error:", err);
    res.status(500).json({ message: err.message });
  }
};
