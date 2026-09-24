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
      availableStock: Number(
        req.body.availableStock || 0
      ),

      shortageQuantity: Number(
        req.body.shortageQuantity || 0
      ),

      requiredDate: req.body.requiredDate,
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
