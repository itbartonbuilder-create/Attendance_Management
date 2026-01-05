import express from "express";
import { upload } from "../middleware/upload.js";
import {
  addEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

// Add Employee
router.post(
  "/",
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),
  addEmployee
);

// Get All Employees
router.get("/", getEmployees);

// Update Employee
router.put(
  "/:id",
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),
  updateEmployee
);

// Delete Employee
router.delete("/:id", deleteEmployee);

export default router;
