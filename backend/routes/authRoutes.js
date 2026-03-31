import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Manager from "../models/Manager.js"; 
import axios from "axios";

dotenv.config();
const router = express.Router();


const getLocationName = async (lat, lng) => {
  try {

    lat = Number(lat);
    lng = Number(lng);

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}` +
      `&lon=${lng}` +
      `&format=jsonv2` +            
      `&addressdetails=1` +         
      `&zoom=18` +                  
      `&accept-language=en`;        

    const res = await axios.get(url, {
      headers: {
        "User-Agent": "bartons-builders-attendance-app", // mandatory
      },
      timeout: 8000,
    });

    if (!res.data) return "Unknown Location";

   
    const address =
      res.data.display_name ||
      res.data.name ||
      res.data.address?.road ||
      res.data.address?.suburb ||
      res.data.address?.city ||
      res.data.address?.state;

    return address || "Unknown Location";

  }catch (err) {
  console.log("📍 Reverse Geocode FULL ERROR:");
  console.log("Status:", err.response?.status);
  console.log("Data:", err.response?.data);
  console.log("Message:", err.message);
  return "Unknown Location";
}
};

router.post("/login", async (req, res) => {
  const { email, password, site, contactNo, captchaToken, latitude, longitude } = req.body;

  try {
    // Check captcha
    if (!captchaToken) return res.status(400).json({ msg: "Captcha required" });

    const captchaRes = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      {},
      { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: captchaToken } }
    );

    if (!captchaRes.data.success) return res.status(400).json({ msg: "Captcha verification failed" });

    if (email && password) {
      if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        return res.json({ msg: "Admin login successful", token, user: { name: "Admin", email, role: "admin" } });
      } 
     
      else if (email === process.env.ACCOUNTANT_EMAIL && password === process.env.ACCOUNTANT_PASSWORD) {
        const token = jwt.sign({ role: "accountant" }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        return res.json({ msg: "Accountant login successful", token, user: { name: "Accountant", email, role: "accountant" } });
      } 
      else {
        return res.status(400).json({ msg: "Invalid admin/accountant credentials" });
      }
    }


    if (site && contactNo) {
      const manager = await Manager.findOne({
        site: { $regex: `^${site.trim()}$`, $options: "i" },
        contactNo
      });
      if (!manager) return res.status(404).json({ msg: "Manager not found" });

      if (latitude !== undefined && longitude !== undefined) {
        manager.latitude = latitude;
        manager.longitude = longitude;
        manager.locationName = await getLocationName(latitude, longitude);
        manager.lastLocationUpdate = new Date();

        const today = new Date().toLocaleDateString("en-CA");
        if (!manager.locationHistory) manager.locationHistory = [];
        if (!manager.locationHistory.find(l => l.date === today)) {
          manager.locationHistory.push({ latitude, longitude, locationName: manager.locationName, date: today, time: new Date() });
        }

        await manager.save();
      }

      const token = jwt.sign({ id: manager._id, role: "manager" }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
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
        }
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
    const managers = await Manager.find({ site: { $regex: `^${site.trim()}$`, $options: "i" } });
    const data = [];

    managers.forEach((m) => {
      const loc = m.locationHistory?.find(l => l.date === date);
      if (loc) data.push({ name: m.name, role: "manager", ...loc });
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching locations" });
  }
});

router.get("/live-locations", async (req, res) => {
  const { site, date } = req.query;
  if (!site) return res.status(400).json({ msg: "Site is required" });

  const safeSite = site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  try {
    const managers = await Manager.find({ site: { $regex: `^${safeSite}$`, $options: "i" } });
    const data = [];

    if (date) {
      managers.forEach((m) => {
        const loc = m.locationHistory?.find(l => l.date === date);
        if (loc) data.push({ name: m.name, role: "manager", latitude: loc.latitude, longitude: loc.longitude, locationName: loc.locationName, lastUpdate: loc.time });
      });
    } else {
      managers.forEach((m) => {
        if (m.latitude && m.longitude) data.push({ name: m.name, role: "manager", latitude: m.latitude, longitude: m.longitude, locationName: m.locationName, lastUpdate: m.lastLocationUpdate });
      });
    }

    res.json(data);
  } catch (err) {
    console.error("🔥 LIVE LOCATION ERROR:", err);
    res.status(500).json({ msg: "Error fetching locations" });
  }
});


router.post("/update-location", async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  try {
    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ msg: "Missing location data" });
    }

    const manager = await Manager.findById(userId);
    if (!manager) return res.status(404).json({ msg: "Manager not found" });

    manager.latitude = latitude;
    manager.longitude = longitude;
    manager.lastLocationUpdate = new Date();
    await manager.save();

    res.json({ msg: "Location updated instantly" });

    try {
      const locationName = await getLocationName(latitude, longitude);

   
      const freshManager = await Manager.findById(userId);
      if (!freshManager) return;

      freshManager.locationName = locationName;
      await freshManager.save();

      console.log("📍 Address updated:", locationName);
    } catch (bgErr) {
      console.log("Address fetch failed:", bgErr.message);
    }

  } catch (err) {
    console.error("Update location error:", err);
    res.status(500).json({ msg: "Error updating location" });
  }
});

export default router;
