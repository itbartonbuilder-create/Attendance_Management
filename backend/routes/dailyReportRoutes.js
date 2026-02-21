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
