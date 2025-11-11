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
    console.error("🚨 Error fetching workers:", err.message);
    res.status(500).json({ message: err.message });
  }
});


// ✅ Submit or Update Attendance
router.post("/", async (req, res) => {
  try {
    const { date, site, records } = req.body;
    if (!date || !site)
      return res.status(400).json({ success: false, message: "Date & Site are required" });

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    const formattedRecords = records.map((r) => {
      const hours = Number(r.hoursWorked) || 0;
      const overtime = hours > 8 ? hours - 8 : 0;

      return {
        workerId: r.workerId,
        name: r.name,
        roleType: r.roleType,
        role: r.role,
        status: r.status,
        hoursWorked: hours,
        overtimeHours: overtime,
        salary: Number(r.salary) || 0,
        leaveType: r.leaveType || { holiday: false, accepted: false },
      };
    });

    let existing = await Attendance.findOne({ date: localDate, site });

    if (existing) {
      existing.records = formattedRecords;
      await existing.save();
      return res.json({
        success: true,
        message: `✅ Attendance Updated Successfully`,
        attendance: existing,
      });
    }

    const attendance = new Attendance({ date: localDate, site, records: formattedRecords });
    await attendance.save();

    res.json({ success: true, message: `✅ Attendance Submitted Successfully`, attendance });
  } catch (err) {
    console.error("🚨 Error in POST /api/attendance:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Daily Report Fetch
router.get("/reports", async (req, res) => {
  try {
    const { date, site } = req.query;
    if (!date || !site)
      return res.status(400).json({ success: false, message: "Date & Site are required" });

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const report = await Attendance.findOne({ date: queryDate, site });
    res.json({ success: true, records: report ? report.records : [] });
  } catch (err) {
    console.error("🚨 Error fetching attendance reports:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Worker History for Report (used by Report Page)
router.get("/worker-history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { start, end, site } = req.query;

    const query = { "records.workerId": new mongoose.Types.ObjectId(workerId) };
    if (site) query.site = site;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceDocs = await Attendance.find(query).sort({ date: 1 });

    const history = [];
    attendanceDocs.forEach((doc) => {
      const record = doc.records.find((r) => r.workerId.toString() === workerId);
      if (record) {
        const isPaidLeave =
          record.leaveType?.accepted === true || record.leaveType?.holiday === true;

        history.push({
          date: doc.date.toISOString().split("T")[0],
          status: record.status,
          hoursWorked: record.hoursWorked || 0,
          overtimeHours: record.overtimeHours || 0,
          salary: record.salary || 0,
          leaveType: {
            ...record.leaveType,
            paid: isPaidLeave,
            unpaid: !isPaidLeave,
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

export default router;
