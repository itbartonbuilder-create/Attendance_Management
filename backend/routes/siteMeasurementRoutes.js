
import express from "express";
import mongoose from "mongoose";
import SiteMeasurement from "../models/SiteMeasurement.js";
import MeasurementCounter from "../models/MeasurementCounter.js";
import FixedMeasurementRate from "../models/FixedMeasurementRate.js";

const router = express.Router();

async function getNextMeasurementNo(site) {
  const cleanSite = String(site || "").trim();
  const siteKey = cleanSite.toLowerCase();

  if (!cleanSite) {
    throw new Error("Site is required");
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      
      const existingRecords = await SiteMeasurement.find({
        site: cleanSite,
      })
        .select("measurementNo")
        .lean();

      const maxExistingNo = existingRecords.reduce((max, item) => {
        const number = parseInt(item.measurementNo, 10);
        return Number.isFinite(number) ? Math.max(max, number) : max;
      }, 0);

      await MeasurementCounter.findOneAndUpdate(
        { siteKey },
        {
          $max: { seq: maxExistingNo },
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      const counter = await MeasurementCounter.findOneAndUpdate(
        { siteKey },
        { $inc: { seq: 1 } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      return String(counter.seq).padStart(2, "0");
    } catch (err) {

      if (err.code === 11000 && attempt < 4) {
        continue;
      }

      throw err;
    }
  }

  throw new Error("Unable to generate measurement number");
}

function getRateKey({ site, workType, description, unit }) {
  return {
    site: String(site || "").trim(),
    workType: String(workType || "").trim(),
    description: String(description || "").trim(),
    unit: String(unit || "").trim(),
  };
}

async function saveFixedRate({ site, workType, description, unit, rate }) {
  const key = getRateKey({ site, workType, description, unit });

  if (!key.site || !key.workType || !key.unit) {
    throw new Error("Site, work type and unit are required for rate");
  }

  return FixedMeasurementRate.findOneAndUpdate(
    key,
    { $set: { rate: Number(rate) } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
}

router.post("/", async (req, res) => {
  try {
    const {
      site,
      batchId,
      workType,
       workOrderId,
      description,
      length,
      breadth,
      height,
      unitWeight,
      measurementUnit,
      quantity,
      unit,
      remarks,
      date,
      measurementType,
      rate,
    } = req.body;

    if (!site || !String(site).trim() || !workType) {
      return res.status(400).json({
        message: "Site and Work Type are required",
      });
    }

    if (!unit || !String(unit).trim()) {
      return res.status(400).json({ message: "Unit is required" });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) < 0
    ) {
      return res.status(400).json({
        message: "Valid quantity is required",
      });
    }

    if (!date || !Number.isFinite(new Date(date).getTime())) {
      return res.status(400).json({ message: "Valid date is required" });
    }

    const type = measurementType || "calculating";

    if (!["calculating", "fixed"].includes(type)) {
      return res.status(400).json({
        message: "Invalid measurement type",
      });
    }

    let cleanRate = null;
    let amount = null;

    if (type === "fixed") {
      if (
        rate === undefined ||
        rate === null ||
        rate === "" ||
        !Number.isFinite(Number(rate)) ||
        Number(rate) < 0
      ) {
        return res.status(400).json({
          message: "Valid rate is required for Fixed Measurement",
        });
      }

      cleanRate = Number(rate);
      amount = Number(
        (Number(quantity) * cleanRate).toFixed(2)
      );
    }

    const cleanSite = String(site).trim();
    const measurementNo = await getNextMeasurementNo(cleanSite);

    const measurement = new SiteMeasurement({
      site: cleanSite,
      measurementNo,
      batchId: batchId ? String(batchId).trim() : null,
      workOrderId: workOrderId || null,
      workType: String(workType).trim(),
      description: String(description || "").trim(),

      length:
        length !== undefined && length !== null && length !== ""
          ? Number(length)
          : null,

      breadth:
        breadth !== undefined && breadth !== null && breadth !== ""
          ? Number(breadth)
          : null,

      height:
        height !== undefined && height !== null && height !== ""
          ? Number(height)
          : null,

      unitWeight:
        unitWeight !== undefined && unitWeight !== null && unitWeight !== ""
          ? Number(unitWeight)
          : null,

      measurementUnit: measurementUnit
        ? String(measurementUnit).trim()
        : "m",

      quantity: Number(quantity),
      unit: String(unit).trim(),
      remarks: remarks != null ? String(remarks).trim() : "",
      date: new Date(date),

      measurementType: type,
      rate: cleanRate,
      amount,
    });

    const saved = await measurement.save();

    if (type === "fixed") {
      await saveFixedRate({
        site: cleanSite,
        workType,
        description,
        unit,
        rate: cleanRate,
      });
    }

    return res.status(201).json(saved);
  } catch (err) {
    console.error("POST /measurement error:", err);

    return res.status(500).json({
      message: err.message || "Failed to save measurement",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { site, measurementType } = req.query;
    const filter = {};

    if (site) filter.site = String(site).trim();

    if (measurementType === "fixed") {
      filter.measurementType = "fixed";
    } else if (measurementType === "calculating") {
      filter.$or = [
        { measurementType: "calculating" },
        { measurementType: { $exists: false } },
        { measurementType: null },
      ];
    }

    const data = await SiteMeasurement.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    return res.json(data);
  } catch (err) {
    console.error("GET /measurement error:", err);
    return res.status(500).json({
      message: err.message || "Failed to fetch measurements",
    });
  }
});

router.get("/rates", async (req, res) => {
  try {
    const { site, workType, description, unit } = req.query;

    if (!site) {
      return res.status(400).json({ message: "Site is required" });
    }

    const filter = { site: String(site).trim() };

    if (workType && unit) {
      Object.assign(
        filter,
        getRateKey({ site, workType, description, unit })
      );

      const rateRecord = await FixedMeasurementRate.findOne(filter);
      return res.json(rateRecord);
    }

    const rates = await FixedMeasurementRate.find(filter).sort({
      workType: 1,
      description: 1,
    });

    return res.json(rates);
  } catch (err) {
    console.error("GET /measurement/rates error:", err);
    return res.status(500).json({
      message: err.message || "Failed to fetch rates",
    });
  }
});

router.post("/rates", async (req, res) => {
  try {
    const { site, workType, description, unit, rate } = req.body;

    if (
      rate === undefined ||
      rate === null ||
      rate === "" ||
      !Number.isFinite(Number(rate)) ||
      Number(rate) < 0
    ) {
      return res.status(400).json({ message: "Valid rate is required" });
    }

    const savedRate = await saveFixedRate({
      site,
      workType,
      description,
      unit,
      rate,
    });

    return res.status(200).json(savedRate);
  } catch (err) {
    console.error("POST /measurement/rates error:", err);
    return res.status(500).json({
      message: err.message || "Failed to save rate",
    });
  }
});

router.get("/site/:siteId", async (req, res) => {
  try {
    const data = await SiteMeasurement.find({
      site: req.params.siteId,
    }).sort({ date: -1, createdAt: -1 });

    return res.json(data);
  } catch (err) {
    console.error("GET /measurement/site/:siteId error:", err);
    return res.status(500).json({
      message: err.message || "Failed to fetch site measurements",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid measurement ID" });
    }

    const data = await SiteMeasurement.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Measurement not found" });
    }

    return res.json(data);
  } catch (err) {
    console.error("GET /measurement/:id error:", err);
    return res.status(500).json({
      message: err.message || "Failed to fetch measurement",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid measurement ID" });
    }

    const existing = await SiteMeasurement.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Measurement not found" });
    }


    const body = req.body;
    const updates = {};
if (body.workOrderId !== undefined) {
  if (
    body.workOrderId !== null &&
    body.workOrderId !== "" &&
    !mongoose.isValidObjectId(body.workOrderId)
  ) {
    return res.status(400).json({
      message: "Invalid Work Order ID",
    });
  }

  updates.workOrderId = body.workOrderId || null;
}
    for (const field of [
      "site",
      "workType",
      "description",
      "unit",
      "remarks",
      "measurementUnit",
      "batchId",
    ]) {
      if (body[field] !== undefined) {
        updates[field] =
          field === "remarks" || field === "description"
            ? String(body[field] ?? "").trim()
            : body[field] == null
              ? body[field]
              : String(body[field]).trim();
      }
    }

    for (const field of ["length", "breadth", "height", "unitWeight"]) {
      if (body[field] !== undefined) {
        const value = body[field];
        updates[field] =
          value === "" || value === null ? null : Number(value);

        if (
          updates[field] !== null &&
          !Number.isFinite(updates[field])
        ) {
          return res.status(400).json({ message: `Invalid ${field}` });
        }
      }
    }

    if (body.quantity !== undefined) {
      if (
        body.quantity === "" ||
        body.quantity === null ||
        !Number.isFinite(Number(body.quantity)) ||
        Number(body.quantity) < 0
      ) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }
      updates.quantity = Number(body.quantity);
    }

    if (body.date !== undefined) {
      if (!body.date || !Number.isFinite(new Date(body.date).getTime())) {
        return res.status(400).json({ message: "Valid date is required" });
      }
      updates.date = new Date(body.date);
    }

    const type = body.measurementType || existing.measurementType || "calculating";

    if (!["calculating", "fixed"].includes(type)) {
      return res.status(400).json({ message: "Invalid measurement type" });
    }

    updates.measurementType = type;

    if (type === "fixed") {
      const newRate = body.rate !== undefined ? body.rate : existing.rate;

      if (
        newRate === undefined ||
        newRate === null ||
        newRate === "" ||
        !Number.isFinite(Number(newRate)) ||
        Number(newRate) < 0
      ) {
        return res.status(400).json({
          message: "Valid rate is required for Fixed Measurement",
        });
      }

      updates.rate = Number(newRate);

      const newQuantity =
        updates.quantity !== undefined ? updates.quantity : existing.quantity;

      updates.amount = Number(
        (Number(newQuantity) * updates.rate).toFixed(2)
      );
    } else {
      updates.rate = null;
      updates.amount = null;
    }

    const updated = await SiteMeasurement.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (updated.measurementType === "fixed") {
      await saveFixedRate({
        site: updated.site,
        workType: updated.workType,
        description: updated.description,
        unit: updated.unit,
        rate: updated.rate,
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("PUT /measurement/:id error:", err);
    return res.status(500).json({
      message: err.message || "Failed to update measurement",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid measurement ID" });
    }

    const deleted = await SiteMeasurement.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Measurement not found" });
    }

    return res.json({ message: "Measurement deleted successfully" });
  } catch (err) {
    console.error("DELETE /measurement/:id error:", err);
    return res.status(500).json({
      message: err.message || "Failed to delete measurement",
    });
  }
});

export default router;
