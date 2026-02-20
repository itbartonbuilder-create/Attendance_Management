import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";

const router = express.Router();


router.post(
  "/daily-report",
  uploadDailyReport.fields([{ name: "photos", maxCount: 6 }]),
  async (req, res) => {
    try {
      const { date, type, text } = req.body;
      const photos = req.files?.photos?.map((f) => f.path) || [];

      let report = await DailyReport.findOne({ date });

      if (!report) {
        report = new DailyReport({ date });
      }

      if (type === "morning") {
        if (report.morningText || report.morningPhotos.length > 0) {
          return res.status(400).json({ message: "Morning report already submitted" });
        }
        report.morningText = text;
        report.morningPhotos = photos;
      } else if (type === "evening") {
        if (report.eveningText || report.eveningPhotos.length > 0) {
          return res.status(400).json({ message: "Evening report already submitted" });
        }
        report.eveningText = text;
        report.eveningPhotos = photos;
      } else {
        return res.status(400).json({ message: "Invalid type" });
      }

      await report.save();
      res.json({ message: "Report saved", report });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to save report" });
    }
  }
);


router.get("/check-data/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const report = await DailyReport.findOne({ date });

    res.json({
      attendanceExists: false, 
      morningExists: report?.morningText ? true : false,
      eveningExists: report?.eveningText ? true : false,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error checking data" });
  }
});


router.get("/report/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const report = await DailyReport.findOne({ date });
    res.json(report || {});
  } catch (err) {
    res.status(500).json({ message: "Error fetching report" });
  }
});

export default router;
