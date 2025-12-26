import express from "express";
import {
  registerVendor,
  loginVendor,
  getAllVendors,
  approveVendor
} from "../controllers/vendorController.js";

const router = express.Router();

router.post("/register", registerVendor);
router.post("/login", loginVendor);
router.get("/", getAllVendors);

// ✅ ADD THIS
router.put("/approve/:id", approveVendor);

export default router;
