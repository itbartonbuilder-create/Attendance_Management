import express from "express";
import SiteMeasurement from "../models/SiteMeasurement.js";

const router = express.Router();



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



    if (!site || !workType) {
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


    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const measurement = new SiteMeasurement({
      site: String(site).trim(),
      batchId: batchId ? String(batchId).trim() : null,
      workType: String(workType).trim(),
        description:
        description || "",

      length:
        length !== undefined &&
        length !== null &&
        length !== ""
          ? Number(length)
          : null,

      breadth:
        breadth !== undefined &&
        breadth !== null &&
        breadth !== ""
          ? Number(breadth)
          : null,

      height:
        height !== undefined &&
        height !== null &&
        height !== ""
          ? Number(height)
          : null,

      unitWeight:
        unitWeight !== undefined &&
        unitWeight !== null &&
        unitWeight !== ""
          ? Number(unitWeight)
          : null,

      measurementUnit:
        measurementUnit
          ? String(measurementUnit).trim()
          : "m",

      quantity: Number(quantity),

      unit: String(unit).trim(),

      remarks:
        remarks !== undefined &&
        remarks !== null
          ? String(remarks).trim()
          : "",

      date,
    });


    const saved =
      await measurement.save();


    return res.status(201).json(saved);

  } catch (err) {
    console.error(
      "POST /measurement error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Failed to save measurement",
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



    if (!site || !workType) {
      return res.status(400).json({
        message:
          "Site and Work Type are required",
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
        message:
          "Valid quantity is required",
      });
    }


    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const updated =
      await SiteMeasurement.findByIdAndUpdate(
        req.params.id,

        {
          site: String(site).trim(),
          batchId: batchId ? String(batchId).trim() : null,
          workType: String(workType).trim(),
           description:
            description || "",

          length:
            length !== undefined &&
            length !== null &&
            length !== ""
              ? Number(length)
              : null,

          breadth:
            breadth !== undefined &&
            breadth !== null &&
            breadth !== ""
              ? Number(breadth)
              : null,

          height:
            height !== undefined &&
            height !== null &&
            height !== ""
              ? Number(height)
              : null,

          unitWeight:
            unitWeight !== undefined &&
            unitWeight !== null &&
            unitWeight !== ""
              ? Number(unitWeight)
              : null,

          measurementUnit:
            measurementUnit
              ? String(measurementUnit).trim()
              : "m",

          quantity: Number(quantity),

          unit: String(unit).trim(),

          remarks:
            remarks !== undefined &&
            remarks !== null
              ? String(remarks).trim()
              : "",

          date,
        },

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
    console.error(
      "PUT /measurement/:id error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Failed to update measurement",
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
