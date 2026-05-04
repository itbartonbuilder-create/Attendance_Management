import express from "express";
import SiteMeasurement from "../models/SiteMeasurement.js";

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const {
      site,
      workType,
      length,
      breadth,
      height,
      quantity,
      unit,
      remarks,
      date
    } = req.body;

    if (!site || !workType || !quantity || !unit || !date) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const measurement = new SiteMeasurement({
      site,
      workType,
      length,
      breadth,
      height,
      quantity,
      unit,
      remarks,
      date
    });

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

    if (!data)
      return res.status(404).json({ message: "Measurement not found" });

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
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Measurement not found" });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SiteMeasurement.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Measurement not found" });

    res.json({ message: "Measurement deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/site/:siteId", async (req, res) => {
  try {
    const data = await SiteMeasurement
      .find({ site: req.params.siteId })
      .sort({ date: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
