import express from "express";
import SiteMeasurement from "../models/SiteMeasurement.js";

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const {
      site,
      workType,
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

    if (
      !site ||
      !workType ||
      quantity === undefined ||
      quantity === null ||
      !unit ||
      !date
    ) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const measurement =
      new SiteMeasurement({
        site,
        workType,
        length: length || 0,
        breadth: breadth || 0,
        height: height || 0,
        unitWeight:
          unitWeight !== undefined &&
          unitWeight !== null
            ? unitWeight
            : null,
        measurementUnit:
          measurementUnit || "m",
        quantity,
        unit,
        remarks: remarks || "",
        date,
      });

    const saved =
      await measurement.save();

    res.status(201).json(saved);
  } catch (err) {
    console.error(
      "Single measurement save error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});


router.post("/bulk", async (req, res) => {
  try {
    const { measurements } =
      req.body;

    if (
      !Array.isArray(measurements) ||
      measurements.length === 0
    ) {
      return res.status(400).json({
        message:
          "No measurements provided",
      });
    }

    // Validate every row
    for (
      let i = 0;
      i < measurements.length;
      i++
    ) {
      const item =
        measurements[i];

      if (
        !item.site ||
        !item.workType ||
        item.quantity ===
          undefined ||
        item.quantity === null ||
        !item.unit ||
        !item.date
      ) {
        return res.status(400).json({
          message: `Required fields missing in row ${
            i + 1
          }`,
        });
      }

      if (
        Number.isNaN(
          Number(item.quantity)
        )
      ) {
        return res.status(400).json({
          message: `Invalid quantity in row ${
            i + 1
          }`,
        });
      }
    }

    const documents =
      measurements.map(
        (item) => ({
          site: item.site,

          workType:
            item.workType,

          length:
            Number(item.length) || 0,

          breadth:
            Number(item.breadth) || 0,

          height:
            Number(item.height) || 0,

          unitWeight:
            item.unitWeight !==
              undefined &&
            item.unitWeight !==
              null
              ? Number(
                  item.unitWeight
                )
              : null,

          measurementUnit:
            item.measurementUnit ||
            "m",

          quantity:
            Number(item.quantity),

          unit: item.unit,

          remarks:
            item.remarks || "",

          date: item.date,
        })
      );

    const saved =
      await SiteMeasurement.insertMany(
        documents
      );

    res.status(201).json({
      message:
        "Measurements saved successfully",
      count: saved.length,
      data: saved,
    });
  } catch (err) {
    console.error(
      "Bulk measurement save error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { site } =
      req.query;

    let filter = {};

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

    res.json(data);
  } catch (err) {
    console.error(
      "Measurement fetch error:",
      err
    );

    res.status(500).json({
      message: err.message,
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
        message:
          "Measurement not found",
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const updated =
      await SiteMeasurement.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updated) {
      return res.status(404).json({
        message:
          "Measurement not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(
      "Measurement update error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});


router.delete(
  "/:id",
  async (req, res) => {
    try {
      const deleted =
        await SiteMeasurement.findByIdAndDelete(
          req.params.id
        );

      if (!deleted) {
        return res.status(404).json({
          message:
            "Measurement not found",
        });
      }

      res.json({
        message:
          "Measurement deleted successfully",
      });
    } catch (err) {
      console.error(
        "Measurement delete error:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

router.get(
  "/site/:siteId",
  async (req, res) => {
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

      res.json(data);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;
