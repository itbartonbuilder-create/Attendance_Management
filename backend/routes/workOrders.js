
import express from "express";
import mongoose from "mongoose";
import WorkOrder from "../models/WorkOrder.js";
import Vendor from "../models/vendorModel.js";
import SiteMeasurement from "../models/SiteMeasurement.js";

const router = express.Router();
const workOrderCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "workordercounters",
  }
);

const WorkOrderCounter =
  mongoose.models.WorkOrderCounter ||
  mongoose.model("WorkOrderCounter", workOrderCounterSchema);

const WORK_CATEGORIES = ["Composite", "Civil", "Electrical"];

const SUPPLY_CATEGORIES = [
  "Aggregate",
  "Sand",
  "Cement",
  "Hardware",
  "Tiles",
  "Steel",
  "Paints",
  "Wood",
  "Glass",
  "Other",
];

const SUBCATEGORIES = {
  Aggregate: ["10mm Aggregate", "20mm Aggregate", "40mm Aggregate", "Stone Dust", "Other"],
  Sand: ["River Sand", "M-Sand", "Plaster Sand", "Other"],
  Cement: ["OPC Cement", "PPC Cement", "White Cement", "Other"],
  Hardware: ["Nails", "Screws", "Binding Wire", "Fasteners", "Other"],
  Tiles: ["Floor Tiles", "Wall Tiles", "Parking Tiles", "Other"],
  Steel: [
    "TMT Bar 8mm",
    "TMT Bar 10mm",
    "TMT Bar 12mm",
    "TMT Bar 16mm",
    "TMT Bar 20mm",
    "Binding Wire",
    "Structural Steel",
    "Other",
  ],
  Paints: ["Primer", "Interior Paint", "Exterior Paint", "Putty", "Enamel Paint", "Other"],
  Wood: ["Plywood", "Timber", "Flush Door", "Other"],
  Glass: ["Clear Glass", "Toughened Glass", "Laminated Glass", "Other"],
  Other: ["Other"],

  Composite: [
    "Civil + Electrical",
    "Civil + Plumbing",
    "Civil + Electrical + Plumbing",
    "Complete Building Work",
    "Other",
  ],
  Civil: [
    "Excavation",
    "Earthwork",
    "Backfilling",
    "PCC",
    "RCC",
    "Reinforcement Steel",
    "Shuttering / Formwork",
    "Brick Work",
    "Block Work",
    "Plaster Work",
    "Putty Work",
    "Painting",
    "Waterproofing",
    "Flooring",
    "Tiling",
    "Marble / Granite",
    "False Ceiling",
    "Road Work",
    "Interlock Paver",
    "Demolition",
    "Other",
  ],
  Electrical: [
    "Conduit Installation",
    "Wiring",
    "Cable Laying",
    "Cable Tray",
    "Panel Installation",
    "DB Installation",
    "Switch / Socket Installation",
    "Light Installation",
    "Fan Installation",
    "Earthing",
    "Electrical Testing",
    "Fire Alarm",
    "CCTV",
    "Other",
  ],
};

function normalizeMobile(value) {
  return String(value || "").replace(/\D/g, "");
}

function getVendorCategory(vendor) {
  const category = vendor?.category;

  return Array.isArray(category)
    ? String(category[0] || "").trim()
    : String(category || "").trim();
}

function getAllowedCategories(vendor) {
  const type = String(vendor?.vendorType || "").toLowerCase();

  if (type === "supply") return SUPPLY_CATEGORIES;
  if (type === "work") return WORK_CATEGORIES;

  return [];
}

async function generateOrderNumber() {
  const counterId = "work-order";

  let counter = await WorkOrderCounter.findById(counterId);

  if (!counter) {
    const existingOrders = await WorkOrder.find({
      orderNumber: /^WO-\d+$/,
    })
      .select("orderNumber")
      .lean();

    const maxExistingNumber = existingOrders.reduce((max, order) => {
      const match = order.orderNumber.match(/^WO-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

   try {
  await WorkOrderCounter.findOneAndUpdate(
    { _id: counterId },
    { $max: { seq: maxExistingNumber } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
} catch (error) {

  if (error.code !== 11000) {
    throw error;
  }
}
  }

  
  counter = await WorkOrderCounter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `WO-${String(counter.seq).padStart(2, "0")}`;
}

router.get("/vendors/search", async (req, res) => {
  try {
    const mobile = normalizeMobile(req.query.mobile);

    if (!mobile) {
      return res.status(400).json({
        message: "Vendor mobile number is required.",
      });
    }

    const vendor = await Vendor.findOne({
      contactNo: mobile,
    }).select(
      "name email companyName contactNo category vendorType gstNumber status vendorCode"
    );

    if (!vendor) {
      return res.status(404).json({
        message: "Registered vendor not found.",
      });
    }

    if (String(vendor.status || "").toLowerCase() !== "approved") {
      return res.status(403).json({
        message: "Vendor account is pending approval.",
      });
    }

    const category = getVendorCategory(vendor);

    if (!getAllowedCategories(vendor).includes(category)) {
      return res.status(400).json({
        message: "Vendor type or registered category is invalid.",
      });
    }

    return res.json({
      _id: vendor._id,
      name: vendor.name || "",
      companyName: vendor.companyName || "",
      mobile: vendor.contactNo || "",
      contactNo: vendor.contactNo || "",
      email: vendor.email || "",
      vendorType: String(vendor.vendorType || "").toLowerCase(),
      category,
      gstNumber: vendor.gstNumber || "",
      vendorCode: vendor.vendorCode || "",
      status: vendor.status,
    });
  } catch (error) {
    console.error("Vendor search error:", error);

    return res.status(500).json({
      message: "Failed to search vendor.",
    });
  }
});
router.get("/", async (req, res) => {
  try {
    const { site, status, category, vendorId } = req.query;
    const filter = {};

    if (site) filter.site = site;
    if (category) filter.category = category;

    if (status && status !== "All") {
      filter.status = status;
    }

    if (vendorId) {
      if (!mongoose.isValidObjectId(vendorId)) {
        return res.status(400).json({
          message: "Invalid vendor ID.",
        });
      }

      filter.vendorId = vendorId;
    }

    const orders = await WorkOrder.find(filter)
      .populate("measurementIds")
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error("Fetch work orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch work orders.",
    });
  }
});

router.post("/", async (req, res) => {
  let createdOrderId = null;
  let linkedMeasurementIds = [];

  try {
    const {
      vendorId,
      category,
      subcategory,
      site,
      workDescription,
      measurementIds = [],
      quantity,
      unit,
      rate,
      startDate,
      deadline,
      createdBy,
    } = req.body;

    if (!mongoose.isValidObjectId(vendorId)) {
      return res.status(400).json({
        message: "Please search for a registered vendor first.",
      });
    }

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        message: "Registered vendor not found.",
      });
    }

    if (String(vendor.status || "").toLowerCase() !== "approved") {
      return res.status(403).json({
        message: "Only approved vendors can receive Work Orders.",
      });
    }

    const vendorType = String(vendor.vendorType || "").toLowerCase();
    const registeredCategory = getVendorCategory(vendor);

    if (!["work", "supply"].includes(vendorType)) {
      return res.status(400).json({
        message: "Invalid vendor type.",
      });
    }

    if (!getAllowedCategories(vendor).includes(registeredCategory)) {
      return res.status(400).json({
        message: "Vendor type or registered category is invalid.",
      });
    }

    if (String(category || "").trim() !== registeredCategory) {
      return res.status(400).json({
        message: "Category must match the vendor's registered category.",
      });
    }

    const allowedSubcategories = SUBCATEGORIES[registeredCategory] || [];
    const selectedSubcategory = String(subcategory || "").trim();

    if (
      !selectedSubcategory ||
      selectedSubcategory.length > 150 ||
      selectedSubcategory === "Other"
    ) {
      return res.status(400).json({
        message: "Please provide a valid subcategory.",
      });
    }

    const isPredefined =
      allowedSubcategories.includes(selectedSubcategory);

    const allowsCustom =
      allowedSubcategories.includes("Other");

    if (!isPredefined && !allowsCustom) {
      return res.status(400).json({
        message: "Invalid subcategory for this vendor category.",
      });
    }

    const cleanSite = String(site || "").trim();
    const cleanDescription = String(workDescription || "").trim();

    if (!cleanSite || !cleanDescription) {
      return res.status(400).json({
        message: "Site and Work Description are required.",
      });
    }

    if (!startDate || !deadline) {
      return res.status(400).json({
        message: "Start Date and Deadline are required.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(deadline);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid start date or deadline.",
      });
    }

    if (end < start) {
      return res.status(400).json({
        message: "Deadline cannot be before start date.",
      });
    }

    let finalQuantity;
    let finalUnit;
    let finalRate;
    let finalAmount;
    let finalMeasurementType = "fixed";

    if (vendorType === "work") {
      if (
        !Array.isArray(measurementIds) ||
        measurementIds.length === 0
      ) {
        return res.status(400).json({
          message: "Select at least one saved Measurement.",
        });
      }

      if (
        measurementIds.some(
          (id) => !mongoose.isValidObjectId(id)
        )
      ) {
        return res.status(400).json({
          message: "One or more Measurement IDs are invalid.",
        });
      }

      linkedMeasurementIds = [
        ...new Set(measurementIds.map(String)),
      ];

      const measurements = await SiteMeasurement.find({
        _id: { $in: linkedMeasurementIds },
        site: cleanSite,
      });

      if (measurements.length !== linkedMeasurementIds.length) {
        return res.status(400).json({
          message:
            "Some Measurements were not found or do not belong to the selected site.",
        });
      }

      if (measurements.some((item) => item.workOrderId)) {
        return res.status(409).json({
          message:
            "One or more Measurements are already linked to a Work Order.",
        });
      }

      const types = [
        ...new Set(
          measurements.map((item) =>
            item.measurementType === "fixed"
              ? "fixed"
              : "calculating"
          )
        ),
      ];

      if (types.length !== 1) {
        return res.status(400).json({
          message:
            "Select Measurements of the same type: Fixed or Calculating.",
        });
      }

      finalMeasurementType = types[0];

      const units = [
        ...new Set(
          measurements.map((item) =>
            String(item.unit || "").trim()
          )
        ),
      ];

      finalQuantity = measurements.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      finalUnit = units.length === 1 ? units[0] : "Multiple units";

      if (finalMeasurementType === "fixed") {
        if (
          measurements.some(
            (item) =>
              item.rate == null ||
              item.amount == null ||
              !Number.isFinite(Number(item.rate)) ||
              !Number.isFinite(Number(item.amount))
          )
        ) {
          return res.status(400).json({
            message:
              "A selected Fixed Measurement is missing its rate or amount.",
          });
        }

        finalAmount = Number(
          measurements
            .reduce((sum, item) => sum + Number(item.amount), 0)
            .toFixed(2)
        );

        finalRate =
          finalQuantity > 0
            ? Number((finalAmount / finalQuantity).toFixed(2))
            : 0;
      } else {
    
        finalRate = 0;
        finalAmount = 0;
      }

      if (
        !Number.isFinite(finalQuantity) ||
        finalQuantity <= 0
      ) {
        return res.status(400).json({
          message: "Selected Measurements must have valid quantities.",
        });
      }
    } else {
      if (Array.isArray(measurementIds) && measurementIds.length > 0) {
        return res.status(400).json({
          message:
            "Supply orders use manual material details, not Measurements.",
        });
      }

      const cleanUnit = String(unit || "").trim();

      if (
        !cleanUnit ||
        quantity === undefined ||
        quantity === "" ||
        rate === undefined ||
        rate === ""
      ) {
        return res.status(400).json({
          message:
            "Supply orders require quantity, unit and rate.",
        });
      }

      finalQuantity = Number(quantity);
      finalUnit = cleanUnit;
      finalRate = Number(rate);

      if (
        !Number.isFinite(finalQuantity) ||
        !Number.isFinite(finalRate) ||
        finalQuantity <= 0 ||
        finalRate < 0
      ) {
        return res.status(400).json({
          message:
            "Quantity must be greater than zero and rate cannot be negative.",
        });
      }

      finalAmount = Number(
        (finalQuantity * finalRate).toFixed(2)
      );
      finalMeasurementType = "fixed";
      linkedMeasurementIds = [];
    }

    const orderNumber = await generateOrderNumber();

    const order = await WorkOrder.create({
      orderNumber,
      vendorId: vendor._id,
      vendorName:
        vendor.name ||
        vendor.companyName ||
        "Registered Vendor",
      vendorMobile: String(vendor.contactNo || ""),
      category: registeredCategory,
      subcategory: selectedSubcategory,
      site: cleanSite,
      workDescription: cleanDescription,
      quantity: finalQuantity,
      unit: finalUnit,
      rate: finalRate,
      totalAmount: finalAmount,
      measurementIds: linkedMeasurementIds,
      startDate: start,
      deadline: end,
      measurementType: finalMeasurementType,
      status: "Issued",
      createdBy: String(createdBy || "Admin").trim(),
    });

    createdOrderId = order._id;

    if (vendorType === "work") {
      const linkResult = await SiteMeasurement.updateMany(
        {
          _id: { $in: linkedMeasurementIds },
          site: cleanSite,
          $or: [
            { workOrderId: null },
            { workOrderId: { $exists: false } },
          ],
        },
        {
          $set: { workOrderId: order._id },
        }
      );

      if (linkResult.modifiedCount !== linkedMeasurementIds.length) {
       
        await SiteMeasurement.updateMany(
          {
            _id: { $in: linkedMeasurementIds },
            workOrderId: order._id,
          },
          {
            $set: { workOrderId: null },
          }
        );

        await WorkOrder.findByIdAndDelete(order._id);
        createdOrderId = null;

        return res.status(409).json({
          message:
            "One or more Measurements were linked elsewhere. Refresh and select available Measurements again.",
        });
      }
    }

    return res.status(201).json({
      message: "Work Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Create work order error:", error);

    if (createdOrderId) {
      try {
        await SiteMeasurement.updateMany(
          {
            _id: { $in: linkedMeasurementIds },
            workOrderId: createdOrderId,
          },
          {
            $set: { workOrderId: null },
          }
        );

        await WorkOrder.findByIdAndDelete(createdOrderId);
      } catch (cleanupError) {
        console.error("Work Order cleanup error:", cleanupError);
      }
    }

    return res.status(500).json({
      message: "Failed to create work order.",
      error: error.message,
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid work order ID.",
      });
    }

    const allowedStatuses = [
      "Issued",
      "In Progress",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid work order status.",
      });
    }

    const order = await WorkOrder.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Work order not found.",
      });
    }

    return res.json({
      message: "Work order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update work order status error:", error);

    return res.status(500).json({
      message: "Failed to update work order status.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid work order ID.",
      });
    }

    const order = await WorkOrder.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        message: "Work order not found.",
      });
    }

    await SiteMeasurement.updateMany(
      { workOrderId: order._id },
      { $set: { workOrderId: null } }
    );

    return res.json({
      message: "Work order deleted successfully.",
    });
  } catch (error) {
    console.error("Delete work order error:", error);

    return res.status(500).json({
      message: "Failed to delete work order.",
    });
  }
});

export default router;
