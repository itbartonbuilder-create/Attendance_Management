import express from "express";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { date, site, type, records } = req.body;

    if (!date || !site || !records)
      return res.status(400).json({ message: "Missing data" });

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ date: d, site });

    const updatedRecords = await Promise.all(
      records.map(async (r) => {
        let perDay = r.perDaySalary || 0;

        if (r.workerId) {
          const worker = await Worker.findById(r.workerId);
          perDay = worker?.perDaySalary || perDay;
        }

        let hoursWorked = r.hoursWorked || 0;
        let overtimeHours = r.overtimeHours || 0;
        let salary = r.salary || 0;

        if (r.status === "Present") {
          salary = Math.round((perDay / 8) * hoursWorked);
        }

        if (r.status === "Absent") {
          hoursWorked = 0;
          overtimeHours = 0;
          salary = 0;
        }

        if (r.status === "Leave") {
          if (r.leaveType?.holiday || r.leaveType?.accepted) {
            hoursWorked = 8;
            salary = perDay;
          } else {
            hoursWorked = 0;
            salary = 0;
          }
        }

        return {
          workerId: r.workerId,
          name: r.name,
          roleType: r.roleType,
          role: r.role,
          status: r.status,
          leaveType: r.leaveType,
          hoursWorked,
          overtimeHours,
          salary,
          type,
        };
      })
    );

    if (!attendance) {
      attendance = new Attendance({
        date: d,
        site,
        records: updatedRecords,
      });
    } else {
      const others = attendance.records.filter(r => r.type !== type);
      attendance.records = [...others, ...updatedRecords];
    }

    await attendance.save();

    res.json({ success: true, message: "Attendance saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/get", async (req, res) => {
  try {
    const { date, site, type } = req.query;

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ date: d, site });

    if (!attendance) return res.json({ records: [] });

    const rec = type
      ? attendance.records.filter(r => r.type === type)
      : attendance.records;

    res.json({ records: rec });

  } catch (err) {
    res.status(500).json({ message: "Error fetching" });
  }
});

export default router;
