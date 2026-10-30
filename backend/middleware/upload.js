import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";


const employeeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "employees",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

export const uploadEmployee = multer({
  storage: employeeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});





const billStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === "application/pdf";

    return {
      folder: "bills",
      resource_type: isPDF ? "raw" : "image",
      allowed_formats: isPDF
        ? ["pdf"]
        : ["jpg", "jpeg", "png", "webp"],
    };
  },
});
export const uploadBill = multer({
  storage: billStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, PNG and WEBP files are allowed."));
    }
  },
});



const managerDocStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "manager-docs",
    resource_type:
      file.mimetype === "application/pdf" ? "raw" : "image",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  }),
});

export const uploadManagerDocs = multer({
  storage: managerDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});


const dailyReportStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "daily-reports",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

export const uploadDailyReport = multer({
  storage: dailyReportStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});


const siteExpenseStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "site-expenses",
    resource_type:
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ? "raw"
        : "image",
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "pdf",
      "doc",
      "docx",
    ],
  }),
});

export const uploadSiteExpense = multer({
  storage: siteExpenseStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const voucherStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "vouchers",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

export const uploadVoucher = multer({
  storage: voucherStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});
