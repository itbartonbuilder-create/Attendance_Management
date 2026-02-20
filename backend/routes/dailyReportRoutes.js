import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/daily-report",
  uploadDailyReport.fields([
    { name: "morningPhotos", maxCount: 4 },
    { name: "eveningPhotos", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const { date, morningText, eveningText } = req.body;

      const morningPhotos =
        req.files?.morningPhotos?.map((f) => f.path) || [];

      const eveningPhotos =
        req.files?.eveningPhotos?.map((f) => f.path) || [];

      // ✅ MongoDB Save
      const report = new DailyReport({
        date,
        morningText,
        eveningText,
        morningPhotos,
        eveningPhotos,
      });

      await report.save();

      res.json({
        message: "✅ Report saved successfully",
        data: report,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
