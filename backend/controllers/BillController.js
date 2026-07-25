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

    // यह चेक करें कि क्या यूजर लॉग-इन है (यह आपके Auth Middleware पर निर्भर करता है)
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

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

    const uploadedFile = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "bills",
          resource_type: "auto",
          public_id: `bill_${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const billNo = await generateBillNo();

    // यहाँ बदलाव किया गया है: createdBy और createdByName को जोड़ा गया है
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
      
      // ये दो फील्ड्स अब डेटाबेस में नाम सेव करेंगी:
      createdBy: req.user._id,
      createdByName: req.user.name, 

      billFile: uploadedFile.secure_url,
      billFileId: uploadedFile.public_id,
    });

    res.status(201).json(bill);

  } catch (err) {
    console.error("CREATE BILL ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
};
