import express from "express";
import mongoose from "mongoose";
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
    const { date, site, records } = req.body;

    if (!date || !site) {
      return res.status(400).json({ success: false, message: "Date and site are required" });
    }

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
      site: site,
    });

    if (existing) {
      existing.records = formattedRecords;
      await existing.save();
      return res.json({ message: "✅ Attendance Updated", attendance: existing });
    }

    const attendance = new Attendance({
      date: attendanceDate,
      site: site,
      records: formattedRecords,
    });

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
    let summary = { Present: 0, Absent: 0, Leave: 0 };

    attendanceDocs.forEach((doc) => {
      const record = doc.records.find((r) => r.workerId.toString() === workerId);
      if (record) {
        history.push({
          date: doc.date.toISOString().split("T")[0],
          status: record.status,
        });

        if (record.status === "Present") summary.Present++;
        else if (record.status === "Absent") summary.Absent++;
        else if (record.status === "Leave") summary.Leave++;
      }
    });

    res.json({ success: true, history, summary });
  } catch (err) {
    console.error("🚨 Error fetching worker history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
