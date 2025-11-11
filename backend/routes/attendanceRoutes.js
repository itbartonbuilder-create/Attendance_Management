import express from "express";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// 🧩 Save or update attendance
router.post("/save", async (req, res) => {
  try {
    const { date, site, records } = req.body;
    if (!date || !site || !records) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    let attendance = await Attendance.findOne({ date, site });

    if (!attendance) {
      attendance = new Attendance({ date, site, records });
    } else {
      records.forEach((record) => {
        const existing = attendance.records.find(
          (r) => r.workerId.toString() === record.workerId
        );
        if (existing) {
          existing.status = record.status;
          existing.hoursWorked = record.hoursWorked || 0;
          existing.overtimeHours = record.overtimeHours || 0;
          existing.salary = record.salary || 0;
          existing.leaveType = record.leaveType || { holiday: false, accepted: false };
        } else {
          attendance.records.push(record);
        }
      });
    }

    await attendance.save();
    res.json({ success: true, message: "Attendance saved successfully!" });
  } catch (err) {
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, message: "Error saving attendance" });
  }
});

// 🧩 Fetch attendance
router.get("/get", async (req, res) => {
  try {
    const { date, site } = req.query;
    if (!date || !site)
      return res.status(400).json({ success: false, message: "Missing query" });

    const attendance = await Attendance.findOne({ date, site });
    if (!attendance) return res.json({ success: true, records: [] });

    res.json({ success: true, records: attendance.records });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, message: "Error fetching attendance" });
  }
});

export default router;
