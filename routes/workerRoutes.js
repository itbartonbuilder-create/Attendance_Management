import express from "express";
import Worker from "../models/Worker.js";

const router = express.Router();

// GET WORKERS FILTERED BY SITE
router.get("/", async (req, res) => {
  try {
    const { site } = req.query;
    let filter = {};

    if (site) filter.site = site;

    const workers = await Worker.find(filter);
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching workers" });
  }
});

// ADD WORKER
router.post("/", async (req, res) => {
  try {
    const { name, roleType, role, site, perDaySalary, contactNo } = req.body;

    if (!/^\d{10}$/.test(contactNo)) {
      return res.status(400).json({ message: "Invalid contact number" });
    }

    const worker = new Worker({
      name,
      roleType,
      role,
      site,
      perDaySalary,
      contactNo,
    });

    await worker.save();
    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ message: "Error adding worker" });
  }
});

// UPDATE WORKER
router.put("/:id", async (req, res) => {
  try {
    const { name, roleType, role, site, perDaySalary, contactNo } = req.body;

    const updated = await Worker.findByIdAndUpdate(
      req.params.id,
      { name, roleType, role, site, perDaySalary, contactNo },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating worker" });
  }
});

// DELETE WORKER
router.delete("/:id", async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting worker" });
  }
});

export default router;
