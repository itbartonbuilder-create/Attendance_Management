import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Worker from "../models/Worker.js";
import Manager from "../models/Manager.js"; 
import axios from "axios";

dotenv.config();
const router = express.Router();
const getLocationName = async (lat, lng) => {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "User-Agent": "attendance-app"
        }
      }
    );

    return res.data.display_name || "Unknown Location";
  } catch (err) {
    console.log("Location fetch error:", err.message);
    return "Unknown Location";
  }
};
router.post("/login", async (req, res) => {
  const { email, password, name, site, contactNo, captchaToken, latitude, longitude } = req.body;

  try {

    if (!captchaToken) {
      return res.status(400).json({ msg: "Captcha required" });
    }

    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";

    const captchaRes = await axios.post(
      verifyURL,
      {},
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!captchaRes.data.success) {
      return res.status(400).json({ msg: "Captcha verification failed" });
    }

    if (email && password) {
      if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });

        return res.json({
          msg: "Admin login successful",
          token,
          user: { name: "Admin", email, role: "admin" },
        });
      } else {
        return res.status(400).json({ msg: "Invalid admin credentials" });
      }
    }

  
    if (site && contactNo) {
      const manager = await Manager.findOne({ site, contactNo });
      if (!manager) return res.status(404).json({ msg: "Manager not found" });


 if (latitude !== undefined && longitude !== undefined) {
  manager.latitude = latitude;
  manager.longitude = longitude;

  const locationName = await getLocationName(latitude, longitude);
  manager.locationName = locationName;

const today = new Date().toLocaleDateString("en-CA");

manager.lastLocationUpdate = new Date();


if (!manager.locationHistory) manager.locationHistory = [];

const exists = manager.locationHistory.find(l => l.date === today);
if (!exists) {
  manager.locationHistory.push({
    latitude,
    longitude,
    locationName,
    date: today,
    time: new Date()
  });
}

await manager.save();
}

      const token = jwt.sign(
        { id: manager._id, role: "manager" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        msg: "Manager login successful",
        token,
        user: {
          _id: manager._id,
          name: manager.name,
          role: "manager",
          site: manager.site,
          latitude: manager.latitude,
          longitude: manager.longitude,
          locationName: manager.locationName 
        },
      });
    }

    if (name && contactNo) {
      const worker = await Worker.findOne({ name, contactNo });
      if (!worker) return res.status(404).json({ msg: "Worker not found" });

if (latitude !== undefined && longitude !== undefined) {
  worker.latitude = latitude;
  worker.longitude = longitude;

  const locationName = await getLocationName(latitude, longitude);
  worker.locationName = locationName;

const today = new Date().toLocaleDateString("en-CA");

worker.lastLocationUpdate = new Date();


if (!worker.locationHistory) worker.locationHistory = [];

const exists = worker.locationHistory.find(l => l.date === today);

if (!exists) {
  worker.locationHistory.push({
    latitude,
    longitude,
    locationName,
    date: today,
    time: new Date()
  });
}

await worker.save();
}
      const token = jwt.sign(
        { id: worker._id, role: "worker" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        msg: "Worker login successful",
        token,
        user: {
          _id: worker._id,
          name: worker.name,
          role: "worker",
          site: worker.site,
          latitude: worker.latitude,
          longitude: worker.longitude,
          locationName: worker.locationName
        },
      });
    }

    return res.status(400).json({ msg: "Invalid login credentials" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/locations-by-date", async (req, res) => {
  const { date, site } = req.query;

  try {
    const managers = await Manager.find({ site });
    const workers = await Worker.find({ site });

    const data = [];

    managers.forEach((m) => {
      const loc = m.locationHistory.find(l => l.date === date);
      if (loc) {
        data.push({
          name: m.name,
          role: "manager",
          ...loc
        });
      }
    });

    workers.forEach((w) => {
      const loc = w.locationHistory.find(l => l.date === date);
      if (loc) {
        data.push({
          name: w.name,
          role: "worker",
          ...loc
        });
      }
    });

    res.json(data);

  } catch (err) {
    res.status(500).json({ msg: "Error fetching locations" });
  }
});
router.get("/live-locations", async (req, res) => {
  const { site } = req.query;

  try {

    const managers = await Manager.find({ site });
    const workers = await Worker.find({ site });

    const data = [];


    managers.forEach((m) => {
      if (m.latitude != null && m.longitude != null) {
        data.push({
          name: m.name,
          role: "manager",
          latitude: m.latitude,
          longitude: m.longitude,
          locationName: m.locationName,
          lastUpdate: m.lastLocationUpdate,
        });
      }
    });

    workers.forEach((w) => {
     if (w.latitude != null && w.longitude != null) {
        data.push({
          name: w.name,
          role: "worker",
          latitude: w.latitude,
          longitude: w.longitude,
          locationName: w.locationName,
          lastUpdate: w.lastLocationUpdate,
        });
      }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching live locations" });
  }
});

export default router;
