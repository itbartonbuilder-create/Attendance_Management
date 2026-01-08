import express from "express";
import { uploadManagerDocs } from "../middleware/upload.js";
import {
  addEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.post(
  "/",
  uploadManagerDocs.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),
  addEmployee
);

router.get("/", getEmployees);

router.put(
  "/:id",
  uploadManagerDocs.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),
  updateEmployee
);

router.delete("/:id", deleteEmployee);

export default router;
