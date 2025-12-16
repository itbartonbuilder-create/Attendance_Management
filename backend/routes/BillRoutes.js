import express from "express";
import { createBill } from "../controllers/BillController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/create", upload.single("billFile"), createBill);

export default router;
