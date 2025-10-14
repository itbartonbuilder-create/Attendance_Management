import express from "express";
import Manager from "../models/Manager.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const managers = await Manager.find();
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching managers" });
  }
});


router.get("/count", async (req, res) => {
  try {
    const count = await Manager.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching manager count" });
  }
});


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


router.put("/:id", async (req, res) => {
  try {
    const { name, email, contactNo, site } = req.body;

    const updatedManager = await Manager.findByIdAndUpdate(
      req.params.id,
      { name, email, contactNo, site },
      { new: true }
    );

    if (!updatedManager)
      return res.status(404).json({ message: "Manager not found" });

    res.json(updatedManager);
  } catch (error) {
    res.status(500).json({ message: "Error updating manager" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Manager.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Manager not found" });
    res.json({ message: "Manager deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting manager" });
  }
});

export default router;
