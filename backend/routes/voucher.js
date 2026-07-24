import express from "express";
import { createVoucher, getVouchers, getNextVoucherNumber } from "../controllers/VoucherController.js";
import { uploadVoucher } from "../middleware/upload.js";

const router = express.Router();

router.post("/create", uploadVoucher.single("proof"), createVoucher);

router.get("/next-number", getNextVoucherNumber);


router.get("/", getVouchers);

export default router;
