import express from "express";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();


router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    console.error("🚨 Error fetching workers:", err.message);
    res.status(500).json({ message: err.message });
  }
});


router.post("/", async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date) return res.status(400).json({ success: false, message: "Date is required" });


    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const formattedRecords = records.map((r) => ({
      workerId: r.workerId,
      name: r.name,
      role: r.role,
      status: r.status,
    }));

    const existing = await Attendance.findOne({
      date: { $eq: attendanceDate },
    });

    if (existing) {
      existing.records = formattedRecords;
      await existing.save();
      return res.json({ message: "✅ Attendance Updated", attendance: existing });
    }

    const attendance = new Attendance({ date: attendanceDate, records: formattedRecords });
    await attendance.save();
    res.json({ message: "✅ Attendance Saved", attendance });
  } catch (err) {
    console.error("🚨 Error in POST /api/attendance:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get("/reports", async (req, res) => {
  try {
    const { date, workerId } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "Date is required" });

    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);

    const report = await Attendance.findOne({
      date: { $eq: queryDate },
    });

    if (!report) return res.json({ success: true, records: [] });

    let records = report.records.map((r) => ({
      workerId: r.workerId,
      name: r.name,
      role: r.role,
      status: r.status,
    }));

    if (workerId) {
      records = records.filter((r) => r.workerId.toString() === workerId);
    }

    res.json({ success: true, records });
  } catch (err) {
    console.error("🚨 Error fetching attendance reports:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find({}, "name site perDaySalary roleType role");
    res.json(workers);
  } catch (err) {
    console.error("🚨 Error fetching workers:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
