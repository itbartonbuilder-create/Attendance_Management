import express from "express";
import Worker from "../models/Worker.js";
import Manager from "../models/Manager.js";

const router = express.Router();
const API_KEY = "31ef7fe88ef4987d4f519587a9976b67";

router.get("/sites", async (req, res) => {
  try {
   
    const workerSites = await Worker.distinct("site");
    const managerSites = await Manager.distinct("site");

    const allSites = [...new Set([...workerSites, ...managerSites])];

    if (allSites.length === 0) {
      return res.json([]);
    }

    const weatherPromises = allSites.map(async (city) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&units=metric&appid=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      return {
        site: city,
        temp: data.main?.temp,
        condition: data.weather?.[0]?.main,
        description: data.weather?.[0]?.description,
        wind: data.wind?.speed,
        humidity: data.main?.humidity,
      };
    });

    const results = await Promise.all(weatherPromises);

    res.json(results);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
