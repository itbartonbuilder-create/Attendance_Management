import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// 🧩 Save or update attendance
router.post("/", async (req, res) => {
  try {
    const { date, site, records } = req.body;

    if (!date || !site || !records)
      return res.status(400).json({ success: false, message: "Missing data" });

    // normalize date (avoid time drift)
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ date: localDate, site });

    // 🧩 compute overtime, salary, etc.
    const updatedRecords = await Promise.all(
      records.map(async (r) => {
        const worker = await Worker.findById(r.workerId);
        const perDay = worker?.perDaySalary || 0;

        const leaveType = r.leaveType || {};
        const isPaidLeave = leaveType.holiday || leaveType.accepted;

        let hoursWorked = Number(r.hoursWorked) || 0;
        let overtimeHours = r.overtimeHours || 0;
        let salary = Number(r.salary) || 0;

        // recalculate salary for paid leave or present
        if (r.status === "Present") {
          const total = Math.min(12, hoursWorked);
          salary = Math.round((perDay / 8) * total);
          overtimeHours = total > 8 ? total - 8 : 0;
        } else if (r.status === "Leave") {
          if (isPaidLeave) {
            hoursWorked = 8;
            overtimeHours = 0;
            salary = perDay;
          } else {
            hoursWorked = 0;
            overtimeHours = 0;
            salary = 0;
          }
        } else if (r.status === "Absent") {
          hoursWorked = 0;
          overtimeHours = 0;
          salary = 0;
        }

        return {
          workerId: r.workerId,
          name: r.name,
          roleType: r.roleType,
          role: r.role,
          status: r.status,
          hoursWorked,
          overtimeHours,
          salary,
          leaveType,
        };
      })
    );

    if (!attendance) {
      attendance = new Attendance({ date: localDate, site, records: updatedRecords });
    } else {
      attendance.records = updatedRecords;
    }

    await attendance.save();
    res.json({ success: true, message: "✅ Attendance saved successfully!" });
  } catch (err) {
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, message: "Error saving attendance" });
  }
});

// 🧩 Fetch attendance by date + site
router.get("/get", async (req, res) => {
  try {
    const { date, site } = req.query;
    if (!date || !site)
      return res.status(400).json({ success: false, message: "Missing query" });

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ date: queryDate, site });
    res.json({ success: true, records: attendance ? attendance.records : [] });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, message: "Error fetching attendance" });
  }
});

// 🧩 Worker history (used in report)
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

    const docs = await Attendance.find(query).sort({ date: 1 });

    const history = docs.flatMap((doc) => {
      const rec = doc.records.find((r) => r.workerId.toString() === workerId);
      if (!rec) return [];
      const isPaidLeave = rec.leaveType?.holiday || rec.leaveType?.accepted;
      return {
        date: doc.date.toISOString().split("T")[0],
        status: rec.status,
        hoursWorked: rec.hoursWorked || 0,
        overtimeHours: rec.overtimeHours || 0,
        salary: rec.salary || 0,
        leaveType: {
          ...rec.leaveType,
          paid: isPaidLeave,
          unpaid: !isPaidLeave,
        },
      };
    });

    res.json({ success: true, history });
  } catch (err) {
    console.error("Error fetching worker history:", err);
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
});

export default router;
