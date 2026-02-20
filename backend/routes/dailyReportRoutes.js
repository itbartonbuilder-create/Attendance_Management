import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";

const router = express.Router();


router.post(
  "/daily-report",
  uploadDailyReport.fields([{ name: "photos", maxCount: 6 }]),
  async (req, res) => {
    try {
      const { date, type, text, siteId, userRole } = req.body;

      if (!siteId) return res.status(400).json({ message: "SiteId is required" });
      if (!["morning", "evening"].includes(type)) return res.status(400).json({ message: "Invalid type" });

      
      if (userRole === "manager" && siteId !== req.body.assignedSite)
        return res.status(403).json({ message: "You can only submit for your site" });

      const photos = req.files?.photos?.map((f) => f.path) || [];

      let report = await DailyReport.findOne({ date, siteId });
      if (!report) report = new DailyReport({ date, siteId });

      if (type === "morning") {
        if (report.morningText || report.morningPhotos.length > 0)
          return res.status(400).json({ message: "Morning report already submitted" });
        report.morningText = text;
        report.morningPhotos = photos;
      } else if (type === "evening") {
        if (report.eveningText || report.eveningPhotos.length > 0)
          return res.status(400).json({ message: "Evening report already submitted" });
        report.eveningText = text;
        report.eveningPhotos = photos;
      }

      await report.save();
      res.json({ message: "Report saved", report });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to save report" });
    }
  }
);

router.get("/check-data/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const siteId = req.query.siteId;
    if (!siteId) return res.status(400).json({ message: "SiteId is required" });

    const report = await DailyReport.findOne({ date, siteId });

    res.json({
      morningExists: !!report?.morningText,
      eveningExists: !!report?.eveningText,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error checking data" });
  }
});


router.get("/report/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const siteId = req.query.siteId;
    if (!siteId) return res.status(400).json({ message: "SiteId is required" });

    const report = await DailyReport.findOne({ date, siteId });
    res.json(report || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching report" });
  }
});

export default router;
