import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";

const router = express.Router();


router.get("/check-data/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { siteId } = req.query;

    const report = await DailyReport.findOne({ date, siteId });

    res.json({
      morningExists: !!report?.morningText,
      eveningExists: !!report?.eveningText,
    });

  } catch (err) {
    res.status(500).json({ error: "Check failed" });
  }
});



router.post(
  "/daily-report",
  uploadDailyReport.fields([
    { name: "morningPhotos", maxCount: 4 },
    { name: "eveningPhotos", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const { date, siteId, morningText, eveningText } = req.body;

      if (!date || !siteId)
        return res.status(400).json({ error: "Missing date or siteId" });

      const morningPhotos =
        req.files?.morningPhotos?.map((f) => f.path) || [];

      const eveningPhotos =
        req.files?.eveningPhotos?.map((f) => f.path) || [];

      const report = await DailyReport.findOneAndUpdate(
        { date, siteId },
        {
          $set: {
            ...(morningText && { morningText }),
            ...(eveningText && { eveningText }),
            ...(morningPhotos.length && { morningPhotos }),
            ...(eveningPhotos.length && { eveningPhotos }),
          },
        },
        { new: true, upsert: true }
      );

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



router.get("/report/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { siteId, role } = req.query;

    let reports;

    if (role === "admin") {
     
      reports = await DailyReport.find({ date });
    } else {
      
      reports = await DailyReport.find({ date, siteId });
    }

    res.json(reports);

  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

export default router;
