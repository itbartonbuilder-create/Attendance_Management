import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// 🧩 Save or update attendance for a site/date
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
      // update each worker’s record
      records.forEach((record) => {
        const existing = attendance.records.find(
          (r) => r.workerId.toString() === record.workerId
        );

        if (existing) {
          existing.status = record.status;
          existing.hoursWorked = record.hoursWorked || 0;
          existing.overtimeHours = record.overtimeHours || 0;
          existing.leaveType = record.leaveType || {};
          existing.salary = record.salary || 0;
        } else {
          attendance.records.push(record);
        }
      });
    }

    await attendance.save();
    res.json({ success: true, message: "Attendance saved successfully" });
  } catch (err) {
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, message: "Error saving attendance" });
  }
});

// 🧩 Fetch attendance for a specific date + site
router.get("/get", async (req, res) => {
  try {
    const { date, site } = req.query;
    if (!date || !site) {
      return res.status(400).json({ success: false, message: "Missing query" });
    }

    const attendance = await Attendance.findOne({ date, site }).populate("records.workerId");
    if (!attendance) return res.json({ success: true, records: [] });

    res.json({ success: true, records: attendance.records });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, message: "Error fetching attendance" });
  }
});

// 🧩 Worker History — used for report page
router.get("/worker-history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { start, end } = req.query;

    const records = await Attendance.find({
      date: { $gte: new Date(start), $lte: new Date(end) },
      "records.workerId": workerId,
    });

    const history = [];
    records.forEach((record) => {
      const workerRecord = record.records.find(
        (r) => r.workerId.toString() === workerId
      );

      if (workerRecord) {
        history.push({
          date: record.date.toISOString().split("T")[0],
          status: workerRecord.status,
          hoursWorked: workerRecord.hoursWorked || 0,
          overtimeHours: workerRecord.overtimeHours || 0,
          leaveType: workerRecord.leaveType || {},
          salary: workerRecord.salary || 0,
        });
      }
    });

    res.json({ success: true, history });
  } catch (err) {
    console.error("Error fetching worker history:", err);
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
});

export default router;
