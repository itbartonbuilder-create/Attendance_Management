import express from "express";
import DailyReport from "../models/DailyReport.js";
import { uploadDailyReport } from "../middleware/upload.js";

const router = express.Router();

// --- CHECK IF REPORT EXISTS ---
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
    console.error("Check error:", err);
    res.status(500).json({ error: "Check failed" });
  }
});

// --- SAVE DAILY REPORT ---
router.post(
  "/daily-report",
  uploadDailyReport.fields([
    { name: "morningPhotos", maxCount: 4 },
    { name: "eveningPhotos", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const { date, siteId, morningText, eveningText } = req.body;

      if (!date || !siteId) {
        return res.status(400).json({ error: "Missing date or siteId" });
      }

      const morningPhotos = req.files?.morningPhotos?.map((f) => f.path) || [];
      const eveningPhotos = req.files?.eveningPhotos?.map((f) => f.path) || [];

      // Construct update object
      const updateObj = {};
      if (morningText !== undefined) updateObj.morningText = morningText;
      if (eveningText !== undefined) updateObj.eveningText = eveningText;
      if (morningPhotos.length > 0) updateObj.morningPhotos = morningPhotos;
      if (eveningPhotos.length > 0) updateObj.eveningPhotos = eveningPhotos;

      // Upsert per siteId + date
      const report = await DailyReport.findOneAndUpdate(
        { date, siteId },       // Filter by siteId + date
        { $set: updateObj },    // Update
        { new: true, upsert: true, runValidators: true }
      );

      res.json({ message: "Report saved successfully", data: report });
    } catch (err) {
      console.error("SAVE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// --- FETCH REPORTS ---
router.get("/report/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { siteId, role } = req.query;

    if (!siteId && role !== "admin")
      return res.status(400).json({ error: "Missing siteId" });

    const reports =
      role === "admin"
        ? await DailyReport.find({ date })
        : await DailyReport.find({ date, siteId });

    res.json(reports);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

export default router;
