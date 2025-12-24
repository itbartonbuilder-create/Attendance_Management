import express from "express";
import {
  registerVendor,
  loginVendor,
//   getAllVendors,
} from "../controllers/vendorController.js";

const router = express.Router();

router.post("/register", registerVendor);
router.post("/login", loginVendor);


// router.get("/", getAllVendors);

export default router;
