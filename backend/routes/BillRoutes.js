// routes/billRoutes.js
import express from "express";
import { createBill, getBillsByManager } from "../controllers/BillController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/create", upload.single("billFile"), createBill);
router.get("/manager/:managerId", getBillsByManager);

export default router;
