import express from "express";
import Task from "../models/Task.js";
import Manager from "../models/Manager.js";
import Worker from "../models/Worker.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { site, type, assignedTo, title, description, deadline } = req.body;

    if (!site || !type || !assignedTo || !title || !deadline) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user =
      type === "Manager"
        ? await Manager.findOne({ _id: assignedTo, site })
        : await Worker.findOne({ _id: assignedTo, site });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found for this site" });
    }

    const task = new Task({
      site,
      type,
      assignedTo,
      title,
      description,
      deadline,
      assignedDate: new Date(),
      isCompleted: false,
      completedAt: null,
      status: "Pending",
    });

    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const { assignedTo, site } = req.query;

    const filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (site) filter.site = site;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name site contactNo")
      .populate("reassignHistory.assignedTo", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/by-date/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { site } = req.query;

    const filter = { deadline: date };
    if (site) filter.site = site;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name site contactNo")
      .populate("reassignHistory.assignedTo", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/complete/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.isCompleted)
      return res.status(400).json({ message: "Task already completed" });

    task.isCompleted = true;
    task.completedAt = new Date();
    task.status = "Completed";

    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/reassign/:id", async (req, res) => {
  try {
    const { newAssignedTo, type, deadline, adminId } = req.body;

    if (!newAssignedTo || !type || !deadline) {
      return res
        .status(400)
        .json({ message: "Missing reassignment fields" });
    }

    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.isCompleted) {
      return res.status(400).json({
        message: "Completed task cannot be reassigned",
      });
    }

    const user =
      type === "Manager"
        ? await Manager.findOne({ _id: newAssignedTo, site: task.site })
        : await Worker.findOne({ _id: newAssignedTo, site: task.site });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found for this site" });
    }

    task.reassignHistory.push({
      assignedTo: newAssignedTo,
      type,
      reassignedBy: adminId || null,
      deadline,
      reassignedAt: new Date(),
    });
    task.assignedTo = newAssignedTo;
    task.type = type;
    task.deadline = deadline;
    task.assignedDate = new Date();
    task.isCompleted = false;
    task.completedAt = null;
    task.status = "Pending";

    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Task not found" });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Task not found" });

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
