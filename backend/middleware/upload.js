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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});



const billStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "image";

    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      resourceType = "raw";
    }

    return {
      folder: "bills",
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "pdf",
        "doc",
        "docx",
      ],
    };
  },
});

export const uploadBill = multer({
  storage: billStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});



const managerDocStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "image";

    if (file.mimetype === "application/pdf") {
      resourceType = "raw";
    }

    return {
      folder: "manager-docs",
      resource_type: resourceType,
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    };
  },
});

export const uploadManagerDocs = multer({
  storage: managerDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ===== DAILY REPORT PHOTOS =====

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
