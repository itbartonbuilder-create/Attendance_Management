import express from "express";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";
import Employee from "../models/employeeModel.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { date, site, type, records } = req.body;

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      date: localDate,
      site,
    });

    const updatedRecords = await Promise.all(
      records.map(async (r) => {
       
        const person =
          type === "worker"
            ? await Worker.findById(r.workerId)
            : await Employee.findById(r.workerId);

        const perDay = person?.perDaySalary || 0;

        const leaveType = r.leaveType || {};
        const isPaidLeave =
          leaveType.holiday || leaveType.accepted;

        let hoursWorked = 0;
        let overtimeHours = 0;
        let salary = 0;

       
        if (r.status === "Present") {
          const total = Math.min(12, Number(r.hoursWorked) || 0);

          hoursWorked = total;
          overtimeHours = total > 8 ? total - 8 : 0;

          salary = Math.round((perDay / 8) * total);
        }

      
        else if (r.status === "Leave") {
          if (isPaidLeave) {
            hoursWorked = 8;
            overtimeHours = 0;
            salary = perDay;
          }
        }

        else {
          hoursWorked = 0;
          overtimeHours = 0;
          salary = 0;
        }

        return {
          workerId: r.workerId,
          name: r.name,
          roleType: r.roleType,
          role: r.role,
          type,
          status: r.status,
          hoursWorked,
          overtimeHours,
          salary,
          leaveType,
        };
      })
    );

    if (!attendance) {
      attendance = new Attendance({
        date: localDate,
        site,
        records: updatedRecords,
      });
    } else {
      const other = attendance.records.filter(
        (r) => r.type !== type
      );
      attendance.records = [...other, ...updatedRecords];
    }

    await attendance.save();

    res.json({
      success: true,
      records: updatedRecords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});



router.get("/get", async (req, res) => {
  try {
    const { date, site, type } = req.query;

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      date: queryDate,
      site,
    });

    if (!attendance)
      return res.json({ success: true, records: [] });

    const filtered = type
      ? attendance.records.filter((r) => r.type === type)
      : attendance.records;

    res.json({
      success: true,
      records: filtered,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;
