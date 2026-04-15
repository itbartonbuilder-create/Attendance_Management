import express from "express";
import SiteMeasurement from "../models/SiteMeasurement.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const measurement = new SiteMeasurement(req.body);
    const saved = await measurement.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const { site } = req.query;

    let filter = {};
    if (site) filter.site = site;

    const data = await SiteMeasurement
      .find(filter)
      .sort({ date: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await SiteMeasurement.findById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await SiteMeasurement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    await SiteMeasurement.findByIdAndDelete(req.params.id);
    res.json({ message: "Measurement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
