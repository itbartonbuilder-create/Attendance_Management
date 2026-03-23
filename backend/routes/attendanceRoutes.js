import axios from "axios";
import express from "express";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";
import Employee from "../models/employeeModel.js";
import WorkerPayment from "../models/WorkerPayment.js";
import authMiddleware from "../middleware/auth.js";
import Manager from "../models/Manager.js";

const router = express.Router();

// ===================== ATTENDANCE SAVE =====================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { date, site, type, records, latitude, longitude } = req.body;

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      date: localDate,
      site,
    });

    // ===================== PREPARE RECORDS =====================
    const updatedRecords = await Promise.all(
      records.map(async (r) => {
        const person =
          type === "worker"
            ? await Worker.findById(r.workerId)
            : await Employee.findById(r.workerId);

        const perDay =
          type === "worker"
            ? person?.perDaySalary || 0
            : person?.salary || 0;

        const leaveType = r.leaveType || {};
        const isPaidLeave = leaveType.holiday || leaveType.accepted;

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
            salary = perDay;
          }
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

    // ===================== SAVE ATTENDANCE =====================
    if (!attendance) {
      attendance = new Attendance({
        date: localDate,
        site,
        records: updatedRecords,
      });
    } else {
      const other = attendance.records.filter((r) => r.type !== type);
      attendance.records = [...other, ...updatedRecords];
    }

    await attendance.save();

    // ===================== SAVE LOCATION =====================
    if (latitude && longitude) {
      let person;

      if (req.user.role === "manager") {
        person = await Manager.findById(req.user.id);
      } else if (req.user.role === "worker") {
        person = await Worker.findById(req.user.id);
      }

      if (person) {
        person.latitude = latitude;
        person.longitude = longitude;

        let locationName = "Unknown";

        try {
          const res = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: "json",
              },
              headers: {
                "User-Agent": "attendance-app",
              },
            }
          );

          locationName = res.data.display_name || "Unknown";
        } catch (err) {
          console.log("Location fetch error:", err.message);
        }

        person.locationName = locationName;
        person.lastLocationUpdate = new Date();

        if (!person.locationHistory) person.locationHistory = [];

        // ✅ ALWAYS SAVE (BEST)
        person.locationHistory.push({
          latitude,
          longitude,
          locationName,
          date: new Date().toLocaleDateString("en-CA"),
          time: new Date(),
        });

        await person.save();
      }
    }

    res.json({
      success: true,
      records: updatedRecords,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// ===================== GET ATTENDANCE =====================
router.get("/get", async (req, res) => {
  try {
    const { date, site, type } = req.query;

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      date: queryDate,
      site,
    });

    if (!attendance) {
      return res.json({ success: true, records: [] });
    }

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


// ===================== PAYMENT SAVE =====================
router.post("/payment", async (req, res) => {
  try {
    const { workerId, site, amount, date, note } = req.body;

    const payment = new WorkerPayment({
      workerId,
      site,
      amount,
      date,
      note,
    });

    await payment.save();

    res.json({
      success: true,
      payment,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// ===================== PAYMENT HISTORY =====================
router.get("/payment/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { start, end, site } = req.query;

    const query = { workerId };

    if (site) query.site = site;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startDate,
        $lte: endDate,
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
      totalPaid,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
