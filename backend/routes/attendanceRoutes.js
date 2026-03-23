import express from "express";
import authMiddleware from "../middleware/auth.js"; // top me add
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";
import Employee from "../models/employeeModel.js";
import WorkerPayment from "../models/WorkerPayment.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { date, site, type, records, location } = req.body;

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
            console.log("Employee:", person);
console.log("Salary:", person?.salary);
const perDay =
  type === "worker"
    ? person?.perDaySalary || 0
    : person?.salary || 0;

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
           workerId: person._id,
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
        markedByLocation: location 
      });
    } else {
      const other = attendance.records.filter(
        (r) => r.type !== type
      );
      attendance.records = [...other, ...updatedRecords];
       if (location) {
    attendance.markedByLocation = location;
  }
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





router.get("/get", authMiddleware, async (req, res) => {
  try {
    const { date, site, type } = req.query;

   const start = new Date(date);
start.setHours(0, 0, 0, 0);

const end = new Date(date);
end.setHours(23, 59, 59, 999);

const attendance = await Attendance.findOne({
  site,
  date: { $gte: start, $lte: end },
});
    if (!attendance)
      return res.json({ success: true, records: [] });

    const filtered = type
      ? attendance.records.filter((r) => r.type === type)
      : attendance.records;

    let response = {
      success: true,
      records: filtered,
    };

    // ✅ sirf admin ko location milegi
    if (req.user?.role === "admin") {
      response.location = attendance.markedByLocation;
    }

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
router.post("/payment", async (req, res) => {
  try {
    const { workerId, site, amount, date, note } = req.body;

    const payment = new WorkerPayment({
      workerId,
      site,
      amount,
      date,
      note
    });

    await payment.save();

    res.json({
      success: true,
      payment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
router.get("/payment/:workerId", async (req, res) => {
  try {

    const { workerId } = req.params;
    const { start, end, site } = req.query;

    const query = { workerId };

    if (site) {
      query.site = site;
    }

    if (start && end) {

      const startDate = new Date(start);
      const endDate = new Date(end);

      endDate.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const payments = await WorkerPayment.find(query);

    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    res.json({
      success: true,
      payments,
      totalPaid
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
