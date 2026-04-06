import express from "express";
import authMiddleware from "../middleware/auth.js"; 
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


//  DASHBOARD ATTENDANCE SUMMARY
router.get("/summary", async (req, res) => {
  try {
    const { site } = req.query;

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const siteFilter = site ? { site } : {};

    const todayAttendance = await Attendance.findOne({
      ...siteFilter,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    let today = {
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
      overtime: 0
    };

    if (todayAttendance) {
      todayAttendance.records.forEach(r => {
        if (r.status === "Present") today.present++;
        if (r.status === "Absent") today.absent++;
        if (r.status === "Leave") today.leave++;

        if (r.hoursWorked > 8) today.overtime++;
        if (r.hoursWorked > 0 && r.hoursWorked < 8) today.late++;
      });
    }


    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0,0,0,0);

      const end = new Date(start);
      end.setHours(23,59,59,999);

      const dayAttendance = await Attendance.find({
        ...siteFilter,
        date: { $gte: start, $lte: end }
      });

      let present = 0;
      let absent = 0;

      dayAttendance.forEach(a => {
        a.records.forEach(r => {
          if (r.status === "Present") present++;
          if (r.status === "Absent") absent++;
        });
      });

      last7Days.push({
        date: start.toLocaleDateString("en-US", { weekday: "short" }),
        present,
        absent
      });
    }

    const allAttendance = await Attendance.find();

    const siteMap = {};

    allAttendance.forEach(a => {
      a.records.forEach(r => {
        if (!siteMap[a.site]) {
          siteMap[a.site] = { site: a.site, present:0, absent:0, leave:0 };
        }

        if (r.status === "Present") siteMap[a.site].present++;
        if (r.status === "Absent") siteMap[a.site].absent++;
        if (r.status === "Leave") siteMap[a.site].leave++;
      });
    });

    const siteWise = Object.values(siteMap);

    res.json({
      today,
      last7Days,
      siteWise
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Summary error" });
  }
});


export default router;
