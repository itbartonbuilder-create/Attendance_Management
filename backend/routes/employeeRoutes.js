import express from "express";
import { upload } from "../middleware/upload.js";
import {
  addEmployee,
  getEmployees,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),
  addEmployee
);

router.get("/", getEmployees);
router.delete("/:id", deleteEmployee);

export default router;
