import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";

const router = express.Router();
router.get("/worker-history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const workerObjectId = new mongoose.Types.ObjectId(workerId);
    const attendanceDocs = await Attendance.find({
      "records.workerId": workerObjectId,
    }).sort({ date: -1 });

    const history = [];
    let summary = { Present: 0, Absent: 0, Leave: 0 };

    attendanceDocs.forEach((doc) => {
      const record = doc.records.find(
        (r) => r.workerId.toString() === workerId
      );
      if (record) {
        history.push({
          date: doc.date.toISOString().split("T")[0],
          status: record.status,
        });

        if (record.status === "Present") summary.Present++;
        else if (record.status === "Absent") summary.Absent++;
        else if (record.status === "Leave") summary.Leave++;
      }
    });

    res.json({ success: true, history, summary });
  } catch (err) {
    console.error("🚨 Error fetching worker history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
