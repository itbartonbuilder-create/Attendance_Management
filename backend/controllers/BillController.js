import Bill from "../models/BillModel.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import os from "os";
import path from "path";

const generateBillNo = async () => {
  const lastBill = await Bill.findOne().sort({ billNo: -1 });
  return lastBill ? lastBill.billNo + 1 : 1;
};

export const createBill = async (req, res) => {
  try {
    console.log("========= FILE INFO =========");
    console.log("Original :", req.file?.originalname);
    console.log("MimeType :", req.file?.mimetype);
    console.log("Size :", req.file?.size);
    console.log("=============================");

    if (!req.file) {
      return res.status(400).json({
        message: "Bill file required",
      });
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

    // ---------- TEMP FILE ----------
    const tempPath = path.join(
      os.tmpdir(),
      `${Date.now()}_${req.file.originalname}`
    );

    fs.writeFileSync(tempPath, req.file.buffer);

    // ---------- CLOUDINARY ----------
    const uploadedFile = await cloudinary.uploader.upload(tempPath, {
      folder: "bills",

      resource_type:
        req.file.mimetype === "application/pdf"
          ? "raw"
          : "image",

      public_id: `bill_${Date.now()}`,
      overwrite: true,
    });

    fs.unlinkSync(tempPath);

    console.log("========= CLOUDINARY =========");
    console.log(uploadedFile);
    console.log("==============================");

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

    res.status(201).json(bill);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
};
