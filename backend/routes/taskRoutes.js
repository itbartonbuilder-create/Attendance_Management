import express from "express";
import Task from "../models/Task.js";
import Manager from "../models/Manager.js";
import Worker from "../models/Worker.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { site, type, assignedTo, title, description, deadline } = req.body;
    const user = type === "Manager"
      ? await Manager.findOne({ _id: assignedTo, site })
      : await Worker.findOne({ _id: assignedTo, site });

    if (!user) return res.status(400).json({ message: "User not found for site" });

    const task = new Task({ site, type, assignedTo, title, description, deadline });
    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { assignedTo } = req.query;
    const filter = assignedTo ? { assignedTo } : {};
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name site contactNo")
      .populate("remarkBy", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Task Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update remark with date
router.put("/remark/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.remarkStatus !== "Pending") {
      return res.status(400).json({ message: "Remark cannot be updated after admin action" });
    }

    const { remark, reason, userId } = req.body;
    task.remark = remark;
    task.reason = reason;
    task.remarkBy = userId;
    task.remarkStatus = "Pending";
    task.status = remark === "Completed" ? "Completed" : "Pending";
    task.remarkDate = new Date(); // ✅ add remark date

    task.acceptedDate = null; // clear old admin dates
    task.rejectedDate = null;

    await task.save();
    res.json({ success: true, updated: task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Accept remark with date
router.put("/remark/accept/:id", async (req, res) => {
  try {
    const { adminReason } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { remarkStatus: "Accepted", adminRejectReason: adminReason || "", acceptedDate: new Date(), rejectedDate: null },
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Reject remark with date
router.put("/remark/reject/:id", async (req, res) => {
  try {
    const { adminReason } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { remarkStatus: "Rejected", adminRejectReason: adminReason, rejectedDate: new Date(), acceptedDate: null },
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
