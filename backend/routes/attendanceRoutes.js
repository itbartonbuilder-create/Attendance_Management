import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// --- Save or update attendance ---
router.post("/", async (req, res) => {
  try {
    const { date, site, type, records } = req.body;
    if (!date || !site || !records || !type)
      return res.status(400).json({ success: false, message: "Missing data" });

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ date: localDate, site });

    const updatedRecords = await Promise.all(
      records.map(async r => {
        const worker = await Worker.findById(r.workerId);
        const perDay = worker?.perDaySalary || 0;
        const leaveType = r.leaveType || {};
        const isPaidLeave = leaveType.holiday || leaveType.accepted;

        let hoursWorked = Number(r.hoursWorked) || 0;
        let overtimeHours = r.overtimeHours || 0;
        let salary = Number(r.salary) || 0;

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
          type // important for merge
        };
      })
    );

    if (!attendance) {
      attendance = new Attendance({ date: localDate, site, records: updatedRecords });
    } else {
      // merge: keep records of other type + update current type
      const otherRecords = attendance.records.filter(r => r.type !== type);
      attendance.records = [...otherRecords, ...updatedRecords];
    }

    await attendance.save();
    res.json({ success: true, message: "✅ Attendance saved successfully!" });
  } catch (err) {
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, message: "Error saving attendance" });
  }
});

// --- Get attendance ---
router.get("/get", async (req, res) => {
  try {
    const { date, site, type } = req.query;
    if (!date || !site) return res.status(400).json({ success: false, message: "Missing query" });

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ date: queryDate, site });
    if (!attendance) return res.json({ success: true, records: [] });

    const filteredRecords = type ? attendance.records.filter(r => r.type === type) : attendance.records;

    res.json({ success: true, records: filteredRecords });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, message: "Error fetching attendance" });
  }
});

export default router;
