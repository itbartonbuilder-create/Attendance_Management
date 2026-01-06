// routes/managers.js
import express from "express";
import { upload } from "../middleware/upload.js"; // multer + cloudinary setup
import Manager from "../models/Manager.js";
import cloudinary from "../utils/cloudinary.js";

const router = express.Router();

/* ================= ADD MANAGER ================= */
router.post(
  "/",
  (req, res, next) => {
    upload.fields([
      { name: "aadhaar", maxCount: 1 },
      { name: "pan", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error("Multer/Cloudinary error:", err);
        return res
          .status(500)
          .json({ message: "File upload error", error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { name, email, contactNo, site } = req.body;

      if (!/^\d{10}$/.test(contactNo)) {
        return res.status(400).json({ message: "Invalid contact number" });
      }

      const aadhaarFile = req.files?.aadhaar?.[0];
      const panFile = req.files?.pan?.[0];

      const newManager = new Manager({
        name,
        email,
        contactNo,
        site,
        aadhaarDoc: aadhaarFile
          ? { url: aadhaarFile.path, public_id: aadhaarFile.filename }
          : null,
        panDoc: panFile
          ? { url: panFile.path, public_id: panFile.filename }
          : null,
      });

      await newManager.save();
      res.status(201).json(newManager);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding manager", error: error.message });
    }
  }
);

/* ================= UPDATE MANAGER ================= */
router.put(
  "/:id",
  (req, res, next) => {
    upload.fields([
      { name: "aadhaar", maxCount: 1 },
      { name: "pan", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error("Multer/Cloudinary error:", err);
        return res
          .status(500)
          .json({ message: "File upload error", error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const manager = await Manager.findById(req.params.id);
      if (!manager) return res.status(404).json({ message: "Manager not found" });

      const { name, email, contactNo, site } = req.body;
      manager.name = name;
      manager.email = email;
      manager.contactNo = contactNo;
      manager.site = site;

      const aadhaarFile = req.files?.aadhaar?.[0];
      const panFile = req.files?.pan?.[0];

      // Replace old Aadhaar if new uploaded
      if (aadhaarFile) {
        if (manager.aadhaarDoc?.public_id) {
          await cloudinary.uploader.destroy(manager.aadhaarDoc.public_id);
        }
        manager.aadhaarDoc = { url: aadhaarFile.path, public_id: aadhaarFile.filename };
      }

      // Replace old PAN if new uploaded
      if (panFile) {
        if (manager.panDoc?.public_id) {
          await cloudinary.uploader.destroy(manager.panDoc.public_id);
        }
        manager.panDoc = { url: panFile.path, public_id: panFile.filename };
      }

      await manager.save();
      res.json(manager);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating manager", error: error.message });
    }
  }
);

/* ================= DELETE MANAGER ================= */
router.delete("/:id", async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: "Manager not found" });

    if (manager.aadhaarDoc?.public_id)
      await cloudinary.uploader.destroy(manager.aadhaarDoc.public_id);
    if (manager.panDoc?.public_id)
      await cloudinary.uploader.destroy(manager.panDoc.public_id);

    await manager.deleteOne();
    res.json({ message: "Manager deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting manager", error: error.message });
  }
});

/* ================= GET ALL MANAGERS ================= */
router.get("/", async (req, res) => {
  try {
    const managers = await Manager.find().sort({ createdAt: -1 });
    res.json(managers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching managers", error: error.message });
  }
});

export default router;
