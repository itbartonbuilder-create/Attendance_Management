import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";


const employeeStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "image";

    if (file.mimetype === "application/pdf") {
      resourceType = "raw";
    }

    return {
      folder: "employees",
      resource_type: resourceType,
      public_id: file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/\s+/g, "_"),
      use_filename: true,
      unique_filename: false,
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    };
  },
});

export const upload = multer({
  storage: employeeStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
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
      public_id: file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/\s+/g, "_"),
      use_filename: true,
      unique_filename: false,
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
    };
  },
});

export const uploadBill = multer({
  storage: billStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
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
      public_id: file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/\s+/g, "_"),
      use_filename: true,
      unique_filename: false,
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    };
  },
});

export const uploadManagerDocs = multer({
  storage: managerDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
