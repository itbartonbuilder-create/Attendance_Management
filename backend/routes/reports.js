// backend/routes/attendanceRoutes.js

import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

/* =====================================================
   ✅ POST /api/attendance/save
   Save attendance for a particular date and site
===================================================== */
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
      attendance.records = records;
    }

    await attendance.save();

    res.json({ success: true, message: "Attendance saved successfully!" });
  } catch (err) {
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   ✅ GET /api/attendance/workers
   Get all workers (for admin or manager views)
===================================================== */
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    console.error("Error fetching workers:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   ✅ GET /api/attendance/worker-history/:workerId
   Fetch worker attendance history between two dates
   Includes: overtime, paid/unpaid leave types, total hours
===================================================== */
router.get("/worker-history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { start, end } = req.query;

    // Validate and prepare query
    const workerObjectId = new mongoose.Types.ObjectId(workerId);
    const query = { "records.workerId": workerObjectId };

    if (start && end) {
      query.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    // Fetch attendance records
    const attendanceDocs = await Attendance.find(query).sort({ date: 1 });

    const history = [];

    attendanceDocs.forEach((doc) => {
      const record = doc.records.find((r) => r.workerId.toString() === workerId);
      if (record) {
        history.push({
          date: doc.date.toISOString().split("T")[0],
          status: record.status,
          hoursWorked: record.hoursWorked || 0,
          overtimeHours: record.overtimeHours || 0,
          salary: record.salary || 0,
          leaveType: {
            holiday: record.leaveType?.holiday || false,
            accepted: record.leaveType?.accepted || false,
          },
        });
      }
    });

    res.json({ success: true, history });
  } catch (err) {
    console.error("🚨 Error fetching worker history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   ✅ GET /api/attendance/site-history/:site
   Optional route to view attendance by site and date
===================================================== */
router.get("/site-history/:site", async (req, res) => {
  try {
    const { site } = req.params;
    const { start, end } = req.query;

    const query = { site };
    if (start && end) {
      query.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    const data = await Attendance.find(query).sort({ date: 1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching site history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   ✅ DELETE /api/attendance/delete/:id
   Delete an attendance record by ID (optional admin use)
===================================================== */
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Attendance.findByIdAndDelete(id);
    res.json({ success: true, message: "Attendance record deleted." });
  } catch (err) {
    console.error("Error deleting attendance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
