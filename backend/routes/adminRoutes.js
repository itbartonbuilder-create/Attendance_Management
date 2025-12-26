import express from "express";
import { approveVendor } from "../controllers/adminController.js";

const router = express.Router();

router.put("/approve-vendor/:id", approveVendor);

export default router;
