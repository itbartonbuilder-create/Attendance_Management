import express from "express";
import Task from "../models/Task.js";
import Manager from "../models/Manager.js";
import Worker from "../models/Worker.js";

const router = express.Router();


// ================= CREATE TASK =================
router.post("/create", async (req, res) => {
  try {
    const { site, type, assignedTo, title, description, deadline } =
      req.body;

    // 🔹 Ensure user belongs to SAME SITE
    const user =
      type === "Manager"
        ? await Manager.findOne({ _id: assignedTo, site })
        : await Worker.findOne({ _id: assignedTo, site });

    if (!user)
      return res
        .status(400)
        .json({ message: "User not found for this site" });

    const task = new Task({
      site,
      type,
      assignedTo,
      title,
      description,
      deadline,
    });

    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= GET ALL TASKS =================
router.get("/", async (req, res) => {
  try {
    const { site, assignedTo } = req.query;

    const filter = {};
    if (site) filter.site = site;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name site")
      .populate("reassignedFrom", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= GET TASKS BY DATE =================
router.get("/by-date/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { site } = req.query;

    const filter = { deadline: date };
    if (site) filter.site = site;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name site")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= COMPLETE TASK =================
router.put("/complete/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: "Completed",
        completedAt: new Date().toISOString(),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= REASSIGN TASK =================
router.put("/reassign/:id", async (req, res) => {
  try {
    const { newUserId, type } = req.body;

    const oldTask = await Task.findById(req.params.id);

    if (!oldTask)
      return res.status(404).json({ message: "Task not found" });

    // 🔹 Check new user belongs to SAME SITE
    const newUser =
      type === "Manager"
        ? await Manager.findOne({ _id: newUserId, site: oldTask.site })
        : await Worker.findOne({ _id: newUserId, site: oldTask.site });

    if (!newUser)
      return res
        .status(400)
        .json({ message: "User not from same site" });

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: newUserId,
        type,
        status: "Reassigned",
        reassignedFrom: oldTask.assignedTo,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= DELETE TASK =================
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
