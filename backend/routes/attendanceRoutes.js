import express from "express";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";

const router = express.Router();

/**
 * ✅ Fetch all workers
 */
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find({});
    res.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ Get worker attendance history within a date range
 * Includes:
 * - Present / Absent / Leave days
 * - Paid Leave detection (holiday or accepted)
 * - Overtime hours
 */
router.get("/worker-history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Start and end date are required.",
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // include entire day

    const history = await Attendance.find({
      workerId: id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    if (!history.length) {
      return res.json({ success: true, history: [] });
    }

    // ✅ Normalize fields for frontend
    const formatted = history.map((rec) => {
      let leaveType = null;
      let overtimeHours = rec.overtimeHours || 0;
      let hoursWorked = rec.hoursWorked || 0;

      // LeaveType structure normalized
      if (rec.status === "Leave") {
        if (rec.holiday === true) {
          leaveType = { holiday: true, accepted: true };
        } else if (rec.leaveAccepted === true) {
          leaveType = { accepted: true };
        } else {
          leaveType = { accepted: false };
        }
      }

      return {
        _id: rec._id,
        date: rec.date.toISOString().split("T")[0],
        status: rec.status,
        hoursWorked,
        overtimeHours,
        leaveType,
      };
    });

    res.json({ success: true, history: formatted });
  } catch (error) {
    console.error("Error fetching worker history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ Mark attendance (for manager/admin)
 * Handles:
 * - Regular attendance
 * - Overtime
 * - Leave (Paid/Unpaid)
 */
router.post("/mark", async (req, res) => {
  try {
    const {
      workerId,
      date,
      status,
      hoursWorked = 0,
      overtimeHours = 0,
      holiday = false,
      leaveAccepted = false,
    } = req.body;

    if (!workerId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const existing = await Attendance.findOne({ workerId, date });
    if (existing) {
      existing.status = status;
      existing.hoursWorked = hoursWorked;
      existing.overtimeHours = overtimeHours;
      existing.holiday = holiday;
      existing.leaveAccepted = leaveAccepted;
      await existing.save();
      return res.json({
        success: true,
        message: "Attendance updated successfully.",
      });
    }

    const newRec = new Attendance({
      workerId,
      date,
      status,
      hoursWorked,
      overtimeHours,
      holiday,
      leaveAccepted,
    });

    await newRec.save();
    res.json({ success: true, message: "Attendance marked successfully." });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ Summary API (optional)
 * If you want to use it for dashboard stats
 */
router.get("/summary/:site", async (req, res) => {
  try {
    const { site } = req.params;
    const workers = await Worker.find({ site });

    const report = [];

    for (const w of workers) {
      const attendance = await Attendance.find({ workerId: w._id });
      const totalDays = attendance.length;
      const presentDays = attendance.filter((r) => r.status === "Present").length;
      const leaveDays = attendance.filter((r) => r.status === "Leave").length;
      const overtime = attendance.reduce(
        (acc, r) => acc + (r.overtimeHours || 0),
        0
      );

      report.push({
        worker: w.name,
        totalDays,
        presentDays,
        leaveDays,
        overtime,
      });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error("Error in summary:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
