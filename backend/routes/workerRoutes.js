import express from "express";
import Worker from "../models/Worker.js";

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching workers" });
  }
});


router.get("/count", async (req, res) => {
  try {
    const count = await Worker.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching worker count" });
  }
});


router.post("/", async (req, res) => {
  try {
    const { name, roleType, role, site, perDaySalary } = req.body;

    const newWorker = new Worker({ name, roleType, role, site, perDaySalary });
    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (error) {
    res.status(500).json({ message: "Error adding worker" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting worker" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { name, roleType, role, site, perDaySalary } = req.body;

    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      { name, roleType, role, site, perDaySalary },
      { new: true } 
    );

    if (!updatedWorker)
      return res.status(404).json({ message: "Worker not found" });

    res.json(updatedWorker);
  } catch (error) {
    res.status(500).json({ message: "Error updating worker" });
  }
});

export default router;
