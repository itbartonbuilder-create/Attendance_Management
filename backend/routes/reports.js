import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// ✅ Fetch workers
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find({}, "name site perDaySalary roleType role");
    res.json(workers);
  } catch (err) {
    console.error("🚨 Error fetching workers:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add / Update Attendance (with overtime)
router.post("/", async (req, res) => {
  try {
    const { date, site, records } = req.body;
    if (!date || !site)
      return res.status(400).json({ success: false, message: "Date & Site are required" });

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    // ✅ Calculate overtime per record
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
        overtimeHours: overtime, // ✅ new field
        salary: r.salary || 0,
      };
    });

    let existing = await Attendance.findOne({ date: localDate, site });

    if (existing) {
      existing.records = formattedRecords;
      await existing.save();
      return res.json({
        success: true,
        message: `✅ Attendance Updated Successfully for ${site}`,
        attendance: existing,
      });
    }

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

// ✅ Reports route
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

// ✅ Worker history with overtime
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
    let summary = { Present: 0, Absent: 0, Leave: 0, overtimeTotal: 0 };

    attendanceDocs.forEach((doc) => {
      const record = doc.records.find((r) => r.workerId.toString() === workerId);
      if (record) {
        history.push({
          date: doc.date.toISOString().split("T")[0],
          status: record.status,
          hoursWorked: record.hoursWorked || 0,
          overtimeHours: record.overtimeHours || 0,
          salary: record.salary || 0,
        });

        if (record.status === "Present") summary.Present++;
        else if (record.status === "Absent") summary.Absent++;
        else if (record.status === "Leave") summary.Leave++;

        summary.overtimeTotal += record.overtimeHours || 0;
      }
    });

    res.json({ success: true, history, summary });
  } catch (err) {
    console.error("🚨 Error fetching worker history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
