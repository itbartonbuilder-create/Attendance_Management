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
router.post(
  "/daily-report",
  uploadDailyReport.fields([
    { name: "morningPhotos", maxCount: 4 },
    { name: "eveningPhotos", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const { date, type, morningText, eveningText } = req.body;

      
      const exists = await DailyReport.findOne({ date, type });

      if (exists) {
        return res.status(400).json({
          message: "❌ This update already submitted",
        });
      }

      const morningPhotos =
        req.files?.morningPhotos?.map((f) => f.path) || [];

      const eveningPhotos =
        req.files?.eveningPhotos?.map((f) => f.path) || [];

      const report = new DailyReport({
        date,
        type,
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
router.get("/check-data/:date", async (req, res) => {
  const { date } = req.params;

  const morning = await DailyReport.findOne({
    date,
    type: "morning",
  });

  const evening = await DailyReport.findOne({
    date,
    type: "evening",
  });

  res.json({
    morningExists: !!morning,
    eveningExists: !!evening,
    reportExists: !!(morning || evening),
  });
});

export default router;
