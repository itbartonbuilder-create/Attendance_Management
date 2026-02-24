import express from "express";
import Task from "../models/Task.js";
import Manager from "../models/Manager.js";
import Worker from "../models/Worker.js";

const router = express.Router();


router.post("/create", async (req, res) => {
  const { site, type, assignedTo, title, description, deadline } =
    req.body;

  const user =
    type === "Manager"
      ? await Manager.findOne({ _id: assignedTo, site })
      : await Worker.findOne({ _id: assignedTo, site });

  if (!user)
    return res
      .status(400)
      .json({ message: "User not from same site" });

  const task = new Task({
    site,
    type,
    assignedTo,
    title,
    description,
    deadline,
  });

  await task.save();
  res.json(task);
});


router.get("/", async (req, res) => {
  const { site, assignedTo } = req.query;

  const filter = {};
  if (site) filter.site = site;
  if (assignedTo) filter.assignedTo = assignedTo;

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name")
    .sort({ createdAt: -1 });

  res.json(tasks);
});


router.put("/complete/:id", async (req, res) => {
  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    {
      status: "Completed",
      completedAt: new Date().toISOString(),
    },
    { new: true }
  );

  res.json(updated);
});


router.put("/reassign/:id", async (req, res) => {
  const { newUserId, type, newDeadline } = req.body;

  const oldTask = await Task.findById(req.params.id);

  const newUser =
    type === "Manager"
      ? await Manager.findOne({
          _id: newUserId,
          site: oldTask.site,
        })
      : await Worker.findOne({
          _id: newUserId,
          site: oldTask.site,
        });

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
      deadline: newDeadline,
      assignedDate: new Date()
        .toISOString()
        .split("T")[0],
    },
    { new: true }
  );

  res.json(updated);
});

export default router;
