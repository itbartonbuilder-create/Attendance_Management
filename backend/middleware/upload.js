import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const employeeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "employees",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
  },
});

export const uploadEmployee = multer({
  storage: employeeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});


const billStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bills",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
  },
});

export const uploadBill = multer({
  storage: billStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});


export const upload = uploadEmployee;
