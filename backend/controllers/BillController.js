import Bill from "../models/BillModel.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

const generateBillNo = async () => {
  const lastBill = await Bill.findOne().sort({ billNo: -1 });
  return lastBill ? lastBill.billNo + 1 : 1;
};

export const createBill = async (req, res) => {
  try {
    console.log("REQ.FILE =>", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "Bill file required" });
    }

    const {
      workName,
      site,
      vendor,
      sentTo,
      amount,
      quantity,
      gstType,
      gstPercent,
      billDate,
    } = req.body;

    const subtotal = Number(amount) * Number(quantity);

    let gstAmount = 0;
    let totalAmount = subtotal;

    if (gstType === "gst") {
      gstAmount = (subtotal * Number(gstPercent)) / 100;
      totalAmount = subtotal + gstAmount;
    }

    // PDF ya Image detect karo
    const resourceType =
      req.file.mimetype === "application/pdf" ? "image" : "image";

    const uploadedFile = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "bills",
          resource_type: resourceType,
          public_id: `bill_${Date.now()}`,
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(error);
          }

          resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    console.log("UPLOADED FILE =>", uploadedFile);

    const billNo = await generateBillNo();

    const bill = await Bill.create({
      workName,
      billNo,
      site,
      vendor,
      sentTo,
      amount,
      quantity,
      gstType,
      gstPercent: gstType === "gst" ? gstPercent : 0,
      gstAmount,
      totalAmount,
      billDate,

      billFile: uploadedFile.secure_url,
      billFileId: uploadedFile.public_id,
    });

    return res.status(201).json(bill);

  } catch (err) {
    console.error("CREATE BILL ERROR ❌", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
