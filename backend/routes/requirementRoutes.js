import express from "express";
import Requirement from "../models/Requirement.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const requirement = await Requirement.create({
      site: req.body.site,
      date: req.body.date,
      category: req.body.category,
      material: req.body.material,
      unit: req.body.unit,
      quantity: Number(req.body.quantity || 0),
      
      priority:
        req.body.priority || "Normal",
      purpose:
        req.body.purpose || "",
      remarks:
        req.body.remarks || "",
      status:
        req.body.status || "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Requirement created successfully",
      data: requirement,
    });

  } catch (error) {
    console.error("CREATE REQUIREMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create requirement",
      error: error.message,
    });
  }
});
router.post("/batch", async (req, res) => {
  try {
    const {
      batchId,
      site,
      date,
      category,
      priority,
      purpose,
      items,
    } = req.body;

    if (!site || !date || !category) {
      return res.status(400).json({
        success: false,
        message: "Site, date and department are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one material",
      });
    }

    const documents = items.map((item) => ({
      site,
      date,
      category,
      material: String(item.material || "").trim(),
      unit: String(item.unit || "").trim(),
      quantity: Number(item.quantity),
      priority: priority || "Normal",
      purpose: purpose || "",
      batchId,
    }));

    const invalid = documents.some(
      (item) =>
        !item.material ||
        !item.unit ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0
    );

    if (invalid) {
      return res.status(400).json({
        success: false,
        message: "Every material needs a name, unit and valid quantity",
      });
    }

    const saved = await Requirement.insertMany(documents);

    return res.status(201).json({
      success: true,
      message: "Requirement batch saved successfully",
      data: saved,
    });
  } catch (error) {
    console.error("BATCH REQUIREMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save requirement batch",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { site } = req.query;
    const filter = site
      ? { site }
      : {};
    const requirements = await Requirement
      .find(filter)
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    console.error("GET REQUIREMENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requirements",
      error: error.message,
    });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const requirement =
      await Requirement.findByIdAndDelete(
        req.params.id
      );

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found",
      });
    }
    res.json({
      success: true,
      message: "Requirement deleted successfully",
    });
  } catch (error) {
    console.error("DELETE REQUIREMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete requirement",
      error: error.message,
    });
  }
});
export default router;
