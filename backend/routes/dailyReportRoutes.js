import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/daily-report",
  uploadDailyReport.fields([
    { name: "photos", maxCount: 6 },
  ]),
  async (req, res) => {
    try {
      const { date, type, text } = req.body;

      const exists = await DailyReport.findOne({
        date,
        type,
      });

      if (exists) {
        return res
          .status(400)
          .json({ message: "Already submitted" });
      }

      const photos =
        req.files?.photos?.map((f) => f.path) || [];

      const report = new DailyReport({
        date,
        type,
        text,
        photos,
      });

      await report.save();

      res.json({ message: "Saved", report });
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  }
);

export default router;
