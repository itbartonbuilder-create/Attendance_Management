import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";

const router = express.Router();



router.get("/worker-history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { start, end } = req.query;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Worker ID",
      });
    }

    const workerObjectId = new mongoose.Types.ObjectId(workerId);

    const query = {
      "records.workerId": workerObjectId,
    };

    // ✅ Date filter
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const attendanceDocs = await Attendance.find(query).sort({ date: 1 });

    const history = [];
    const summary = {
      Present: 0,
      Absent: 0,
      Leave: 0,
      overtimeTotal: 0,
    };

    attendanceDocs.forEach((doc) => {
      const record = doc.records.find(
        (r) => r.workerId.toString() === workerId
      );

      if (record) {
        history.push({
          date: doc.date.toISOString().split("T")[0],
          status: record.status,
          hoursWorked: record.hoursWorked || 0,
          overtimeHours: record.overtimeHours || 0,
          salary: record.salary || 0,
        });

        if (record.status === "Present") summary.Present++;
        else if (record.status === "Absent") summary.Absent++;
        else if (record.status === "Leave") summary.Leave++;

        summary.overtimeTotal += record.overtimeHours || 0;
      }
    });

    res.json({
      success: true,
      history,
      summary,
    });
  } catch (err) {
    console.error("🚨 Error fetching worker history:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});



router.post("/", async (req, res) => {
  try {
    const { date, site, records } = req.body;

    if (!date || !site) {
      return res.status(400).json({
        success: false,
        message: "Date & Site are required",
      });
    }

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    const formattedRecords = records.map((r) => {
      const hours = r.hoursWorked || 0;
      const overtime = hours > 8 ? hours - 8 : 0;

      return {
        workerId: r.workerId,
        name: r.name,
        roleType: r.roleType,
        role: r.role,
        status: r.status,
        hoursWorked: hours,
        overtimeHours: overtime,
        salary: r.salary || 0,
      };
    });

    let existing = await Attendance.findOne({
      date: localDate,
      site,
    });

    if (existing) {
      existing.records = formattedRecords;
      await existing.save();

      return res.json({
        success: true,
        message: `✅ Attendance Updated Successfully for ${site}`,
        attendance: existing,
      });
    }

    const attendance = new Attendance({
      date: localDate,
      site,
      records: formattedRecords,
    });

    await attendance.save();

    res.json({
      success: true,
      message: `✅ Attendance Submitted Successfully for ${site}`,
      attendance,
    });
  } catch (err) {
    console.error("🚨 Error in POST /api/attendance:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});



router.get("/reports", async (req, res) => {
  try {
    const { date, site } = req.query;

    if (!date || !site) {
      return res.status(400).json({
        success: false,
        message: "Date & Site are required",
      });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const report = await Attendance.findOne({
      date: queryDate,
      site,
    });

    if (!report || !report.records.length) {
      return res.json({
        success: true,
        records: [],
      });
    }

    res.json({
      success: true,
      records: report.records,
    });
  } catch (err) {
    console.error("🚨 Error fetching attendance reports:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
