import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";

const router = express.Router();


router.get("/check-data/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { siteId } = req.query;

    if (!siteId) return res.status(400).json({ error: "Missing siteId" });

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
    { name: "morningPhotos", maxCount: 10 },
    { name: "eveningPhotos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { date, siteId, morningText, eveningText } = req.body;

      if (!date || !siteId) {
        return res.status(400).json({ error: "Missing date or siteId" });
      }

      const morningPhotos = req.files?.morningPhotos?.map(f => f.path) || [];
      const eveningPhotos = req.files?.eveningPhotos?.map(f => f.path) || [];

      const updateObj = {};

      if (morningText !== undefined) updateObj.morningText = morningText;
      if (eveningText !== undefined) updateObj.eveningText = eveningText;
      if (morningPhotos.length > 0) updateObj.morningPhotos = morningPhotos;
      if (eveningPhotos.length > 0) updateObj.eveningPhotos = eveningPhotos;

      const report = await DailyReport.findOneAndUpdate(
        { date, siteId },
        { $set: updateObj },
        { new: true, upsert: true }
      );

      res.json({ message: "Report saved", data: report });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);



router.get("/report/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { siteId } = req.query;

    if (!siteId)
      return res.status(400).json({ error: "siteId required" });

    const reports = await DailyReport.find({ date, siteId });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});



router.get("/sites", async (req, res) => {
  try {
    const siteIds = await DailyReport.distinct("siteId");

    const sites = siteIds.map((id, index) => ({
      _id: index,
      siteId: id,
      name: `Site ${id}`,
    }));

    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sites" });
  }
});


export default router;
