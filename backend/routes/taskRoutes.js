import express from "express";
import upload from "../utils/multer.js";   // <-- YOUR MULTER CONFIG ONLY
import Task from "../models/Task.js";
import Manager from "../models/Manager.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// ------------------------------------------------------------------
// ✔ REMOVE ALL multer.diskStorage code (IT WAS WRONG & DUPLICATE)
// ------------------------------------------------------------------

// ================= CREATE TASK =================
router.post("/create", async (req, res) => {
  try {
    const { site, type, assignedTo, title, description, deadline } = req.body;

    let user =
      type === "Manager"
        ? await Manager.findOne({ _id: assignedTo, site })
        : await Worker.findOne({ _id: assignedTo, site });

    if (!user)
      return res.status(400).json({ message: "User not found for site" });

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

// ================= GET TASKS =================
router.get("/", async (req, res) => {
  try {
    const { assignedTo } = req.query;

    let filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name site contactNo")
      .populate("remarkBy", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= UPDATE TASK =================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DELETE TASK =================
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Task Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= ADD REMARK + FILE =================
router.put("/remark/:id", upload.single("proof"), async (req, res) => {
  try {
    const { remark, reason, userId } = req.body;

    const updateObj = {
      remark,
      reason,
      remarkBy: userId,
      remarkStatus: "Pending",
      status: remark === "Completed" ? "Completed" : "Pending",
    };

    if (req.file) {
      updateObj.proofFile = req.file.filename;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updateObj, {
      new: true,
    });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============== ADMIN ACCEPT REMARK =================
router.put("/remark/accept/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { remarkStatus: "Accepted" },
      { new: true }
    );

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============== ADMIN REJECT REMARK =================
router.put("/remark/reject/:id", async (req, res) => {
  try {
    const { rejectReason } = req.body;

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { remarkStatus: "Rejected", adminRejectReason: rejectReason },
      { new: true }
    );

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
