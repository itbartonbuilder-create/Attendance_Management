import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();



router.post(
  "/daily-report",
  authMiddleware,
  uploadDailyReport.fields([{ name: "photos", maxCount: 6 }]),
  async (req, res) => {
    try {
      const { date, type, text } = req.body;

      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const siteId =
        user.role === "manager" ? user.assignedSite : req.body.siteId;

      if (!siteId)
        return res.status(400).json({ message: "SiteId is required" });

      if (!["morning", "evening"].includes(type))
        return res.status(400).json({ message: "Invalid type" });

      const photos = req.files?.photos?.map((f) => f.path) || [];

      let report = await DailyReport.findOne({ date, siteId });
      if (!report) report = new DailyReport({ date, siteId });

      if (type === "morning") {
        if (report.morningText || report.morningPhotos.length > 0)
          return res.status(400).json({ message: "Morning already submitted" });

        report.morningText = text;
        report.morningPhotos = photos;
      } else {
        if (report.eveningText || report.eveningPhotos.length > 0)
          return res.status(400).json({ message: "Evening already submitted" });

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



router.get("/check-data/:date", authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const user = req.user;

    const siteId =
      user.role === "manager" ? user.assignedSite : req.query.siteId;

    const report = await DailyReport.findOne({ date, siteId });

    res.json({
      morningExists: !!report?.morningText,
      eveningExists: !!report?.eveningText,
    });
  } catch (err) {
    res.status(500).json({ message: "Error checking data" });
  }
});


router.get("/report/:date", authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const user = req.user;

    const siteId =
      user.role === "manager" ? user.assignedSite : req.query.siteId;

    const report = await DailyReport.findOne({ date, siteId });

    res.json(report || {});
  } catch (err) {
    res.status(500).json({ message: "Error fetching report" });
  }
});

export default router;
