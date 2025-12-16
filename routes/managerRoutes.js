import express from "express";
import Manager from "../models/Manager.js";

const router = express.Router();

// GET MANAGERS FILTERED BY SITE
router.get("/", async (req, res) => {
  try {
    const { site } = req.query;
    let filter = {};

    if (site) filter.site = site;

    const managers = await Manager.find(filter);
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching managers" });
  }
});

// ADD MANAGER
router.post("/", async (req, res) => {
  try {
    const { name, email, contactNo, site } = req.body;

    if (!/^\d{10}$/.test(contactNo)) {
      return res.status(400).json({ message: "Invalid contact number" });
    }

    const newManager = new Manager({ name, email, contactNo, site });
    await newManager.save();

    res.status(201).json(newManager);
  } catch (error) {
    res.status(500).json({ message: "Error adding manager" });
  }
});

// UPDATE MANAGER
router.put("/:id", async (req, res) => {
  try {
    const { name, email, contactNo, site } = req.body;

    const updated = await Manager.findByIdAndUpdate(
      req.params.id,
      { name, email, contactNo, site },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating manager" });
  }
});

// DELETE MANAGER
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Manager.findByIdAndDelete(req.params.id);
    res.json({ message: "Manager deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting manager" });
  }
});

export default router;
