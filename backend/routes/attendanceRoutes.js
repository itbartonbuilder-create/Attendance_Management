import express from "express";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// 🔹 GET: Fetch all workers
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find({}, "name site perDaySalary roleType role");
    res.json(workers);
  } catch (err) {
    console.error("🚨 Error fetching workers:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// 🔹 POST: Save or update attendance
router.post("/", async (req, res) => {
  try {
    const { date, site, records } = req.body;
    if (!date || !site)
      return res.status(400).json({ success: false, message: "Date & Site are required" });

    // Ensure date is set to start of day UTC (but treat site+date combo unique)
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    const formattedRecords = records.map((r) => ({
      workerId: r.workerId,
      name: r.name,
      roleType: r.roleType,
      role: r.role,
      status: r.status,
    }));

    // ✅ Check attendance only for this site + date combo
    let existing = await Attendance.findOne({ date: localDate, site });

    if (existing) {
      // Update only if exists for this site and date
      existing.records = formattedRecords;
      await existing.save();
      return res.json({
        success: true,
        message: `✅ Attendance Updated Successfully for ${site}`,
        attendance: existing,
      });
    }

    // Otherwise create new record for this site
    const attendance = new Attendance({
      date: localDate,
      site,
      records: formattedRecords,
    });

    await attendance.save();

    res.json({
      success: true,
      message: `✅ Attendance Submitted Successfully for ${site}`,
      attendance,
    });
  } catch (err) {
    console.error("🚨 Error in POST /api/attendance:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 GET: Fetch attendance report by date + site
router.get("/reports", async (req, res) => {
  try {
    const { date, site } = req.query;
    if (!date || !site)
      return res.status(400).json({ success: false, message: "Date & Site are required" });

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const report = await Attendance.findOne({ date: queryDate, site });

    if (!report || !report.records || report.records.length === 0)
      return res.json({ success: true, records: [] });

    res.json({ success: true, records: report.records });
  } catch (err) {
    console.error("🚨 Error fetching attendance reports:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
