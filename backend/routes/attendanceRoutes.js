import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// ✅ Fetch all workers
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find({}, "name site perDaySalary roleType role");
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add or Update Attendance
router.post("/", async (req, res) => {
  try {
    const { date, site, records } = req.body;
    if (!date || !site) return res.status(400).json({ message: "Date & Site required" });

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    const formattedRecords = records.map((r) => {
      const hours = r.hoursWorked || 0;
      const overtime = hours > 8 ? hours - 8 : 0;
      return {
        workerId: r.workerId,
        name: r.name,
        roleType: r.roleType,
        role: r.role,
        status: r.status,
        hoursWorked: hours,
        overtimeHours: overtime,
        salary: r.salary || 0,
      };
    });

    let existing = await Attendance.findOne({ date: localDate, site });
    if (existing) {
      existing.records = formattedRecords;
      await existing.save();
      return res.json({ success: true, message: "✅ Attendance Updated", attendance: existing });
    }

    const attendance = new Attendance({ date: localDate, site, records: formattedRecords });
    await attendance.save();

    res.json({ success: true, message: "✅ Attendance Saved", attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Reports route (by date + site)
router.get("/reports", async (req, res) => {
  try {
    const { date, site } = req.query;
    if (!date || !site)
      return res.status(400).json({ message: "Date & Site are required" });

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const report = await Attendance.findOne({ date: queryDate, site });
    res.json({ success: true, records: report ? report.records : [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Worker History (for Reports Page)
router.get("/worker-history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { start, end } = req.query;

    const workerObjectId = new mongoose.Types.ObjectId(workerId);
    const query = { "records.workerId": workerObjectId };

    if (start && end) {
      query.date = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const attendanceDocs = await Attendance.find(query).sort({ date: 1 });

    const history = [];
    const summary = {
      Present: 0,
      Absent: 0,
      Leave: 0,
      totalHours: 0,
      overtimeHours: 0,
    };

    attendanceDocs.forEach((doc) => {
      const rec = doc.records.find((r) => r.workerId.toString() === workerId);
      if (rec) {
        history.push({
          date: doc.date.toISOString().split("T")[0],
          status: rec.status,
          hoursWorked: rec.hoursWorked || 0,
          overtimeHours: rec.overtimeHours || 0,
        });

        if (rec.status === "Present") {
          summary.Present++;
          summary.totalHours += rec.hoursWorked || 0;
          summary.overtimeHours += rec.overtimeHours || 0;
        } else if (rec.status === "Absent") summary.Absent++;
        else if (rec.status === "Leave") summary.Leave++;
      }
    });

    res.json({ success: true, history, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
