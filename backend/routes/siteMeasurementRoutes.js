import express from "express";
import mongoose from "mongoose";
import SiteMeasurement from "../models/SiteMeasurement.js";
import MeasurementCounter from "../models/MeasurementCounter.js";

const router = express.Router();


async function getNextMeasurementNo(site) {
  const siteKey = String(site).trim().toLowerCase();

  if (!siteKey) {
    throw new Error("Site is required");
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
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
     
      if (err.code !== 11000 || attempt === 4) {
        throw err;
      }
    }
  }

  throw new Error("Unable to generate measurement number");
}



router.post("/", async (req, res) => {
  try {
    const {
      site,
      batchId,
      workType,
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
    } = req.body;

    if (!site || !String(site).trim() || !workType) {
      return res.status(400).json({
        message: "Site and Work Type are required",
      });
    }

    if (!unit) {
      return res.status(400).json({
        message: "Unit is required",
      });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      !Number.isFinite(Number(quantity))
    ) {
      return res.status(400).json({
        message: "Valid quantity is required",
      });
    }

    if (!date || !Number.isFinite(new Date(date).getTime())) {
      return res.status(400).json({
        message: "Valid date is required",
      });
    }

    const cleanSite = String(site).trim();

    const measurementNo = await getNextMeasurementNo(cleanSite);

    const measurement = new SiteMeasurement({
      site: cleanSite,
      measurementNo,
      batchId: batchId ? String(batchId).trim() : null,
      workType: String(workType).trim(),
      description: description || "",

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
        unitWeight !== undefined &&
        unitWeight !== null &&
        unitWeight !== ""
          ? Number(unitWeight)
          : null,

      measurementUnit: measurementUnit
        ? String(measurementUnit).trim()
        : "m",

      quantity: Number(quantity),
      unit: String(unit).trim(),
      remarks: remarks != null ? String(remarks).trim() : "",
      date: new Date(date),
    });

    const saved = await measurement.save();

    return res.status(201).json(saved);
  } catch (err) {
    console.error("POST /measurement error:", err);

    return res.status(500).json({
      message: "Failed to save measurement",
    });
  }
});





router.get("/", async (req, res) => {
  try {
    const { site } = req.query;

    const filter = {};

    if (site) {
      filter.site = site;
    }


    const data =
      await SiteMeasurement
        .find(filter)
        .sort({
          date: -1,
          createdAt: -1,
        });


    return res.json(data);

  } catch (err) {
    console.error(
      "GET /measurement error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Failed to fetch measurements",
    });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const data =
      await SiteMeasurement.findById(
        req.params.id
      );


    if (!data) {
      return res.status(404).json({
        message: "Measurement not found",
      });
    }


    return res.json(data);

  } catch (err) {
    console.error(
      "GET /measurement/:id error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Failed to fetch measurement",
    });
  }
});



router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid measurement ID",
      });
    }

    const {
      site,
      measurementNo,
      batchId,
      workType,
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
    } = req.body;

    const updates = {};

    if (workType !== undefined) {
      if (!String(workType).trim()) {
        return res.status(400).json({
          message: "Work Type is required",
        });
      }
      updates.workType = String(workType).trim();
    }

    if (description !== undefined) {
      updates.description = description || "";
    }

    for (const field of ["length", "breadth", "height", "unitWeight"]) {
      if (req.body[field] !== undefined) {
        const value = req.body[field];

        updates[field] =
          value === "" || value === null ? null : Number(value);

        if (
          updates[field] !== null &&
          !Number.isFinite(updates[field])
        ) {
          return res.status(400).json({
            message: `Invalid ${field}`,
          });
        }
      }
    }

    if (measurementUnit !== undefined) {
      updates.measurementUnit = measurementUnit || "m";
    }

    if (quantity !== undefined) {
      if (
        quantity === "" ||
        quantity === null ||
        !Number.isFinite(Number(quantity))
      ) {
        return res.status(400).json({
          message: "Valid quantity is required",
        });
      }
      updates.quantity = Number(quantity);
    }

    if (unit !== undefined) {
      if (!String(unit).trim()) {
        return res.status(400).json({
          message: "Unit is required",
        });
      }
      updates.unit = String(unit).trim();
    }

    if (remarks !== undefined) {
      updates.remarks = remarks == null ? "" : String(remarks).trim();
    }

    if (date !== undefined) {
      if (!date || !Number.isFinite(new Date(date).getTime())) {
        return res.status(400).json({
          message: "Valid date is required",
        });
      }
      updates.date = new Date(date);
    }

    const updated = await SiteMeasurement.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Measurement not found",
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("PUT /measurement/:id error:", err);

    return res.status(500).json({
      message: "Failed to update measurement",
    });
  }
});




router.delete("/:id", async (req, res) => {
  try {
    const deleted =
      await SiteMeasurement.findByIdAndDelete(
        req.params.id
      );


    if (!deleted) {
      return res.status(404).json({
        message: "Measurement not found",
      });
    }


    return res.json({
      message:
        "Measurement deleted successfully",
    });

  } catch (err) {
    console.error(
      "DELETE /measurement/:id error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Failed to delete measurement",
    });
  }
});




router.get("/site/:siteId", async (req, res) => {
  try {
    const data =
      await SiteMeasurement
        .find({
          site: req.params.siteId,
        })
        .sort({
          date: -1,
          createdAt: -1,
        });


    return res.json(data);

  } catch (err) {
    console.error(
      "GET /measurement/site/:siteId error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Failed to fetch site measurements",
    });
  }
});


export default router;
