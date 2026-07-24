import express from "express";
import { createVoucher, getVouchers, getNextVoucherNumber } from "../controllers/VoucherController.js";

const router = express.Router();


router.post("/create", createVoucher);


router.get("/next-number", getNextVoucherNumber);


router.get("/", getVouchers);

export default router;
