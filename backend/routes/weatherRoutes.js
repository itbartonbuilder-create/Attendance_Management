import express from "express";
import Worker from "../models/Worker.js";
import Manager from "../models/Manager.js";

const router = express.Router();
const API_KEY = "31ef7fe88ef4987d4f519587a9976b67";

router.get("/sites", async (req, res) => {
  try {
const workerCities = await Worker.distinct("weatherCity");
const managerCities = await Manager.distinct("weatherCity");

const allSites = [...new Set([...workerCities, ...managerCities])];

    const weatherPromises = allSites.map(async (city) => {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&units=metric&appid=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

      
        if (data.cod !== 200) {
          return {
            site: city,
            temp: null,
            condition: null,
          };
        }

        return {
          site: city,
          temp: data.main.temp,
          condition: data.weather[0].main,
        };

      } catch {
        return {
          site: city,
          temp: null,
          condition: null,
        };
      }
    });

    const results = await Promise.all(weatherPromises);
    res.json(results);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
