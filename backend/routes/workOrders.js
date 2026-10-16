
import express from "express";
import mongoose from "mongoose";
import WorkOrder from "../models/WorkOrder.js";
import Vendor from "../models/vendorModel.js";

const router = express.Router();

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

  Aggregate: [
    "10mm Aggregate",
    "20mm Aggregate",
    "40mm Aggregate",
    "Stone Dust",
    "Other",
  ],
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
  Paints: [
    "Primer",
    "Interior Paint",
    "Exterior Paint",
    "Putty",
    "Enamel Paint",
    "Other",
  ],
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
  if (vendor?.vendorType === "supply") {
    return SUPPLY_CATEGORIES;
  }

  if (vendor?.vendorType === "work") {
    return WORK_CATEGORIES;
  }

  return [];
}

async function generateOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = `WO-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const exists = await WorkOrder.exists({ orderNumber });

    if (!exists) return orderNumber;
  }

  throw new Error("Could not generate work order number");
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

    if (vendor.status !== "approved") {
      return res.status(403).json({
        message: "Vendor account is pending approval.",
      });
    }

    const category = getVendorCategory(vendor);
    const allowedCategories = getAllowedCategories(vendor);

    if (!allowedCategories.includes(category)) {
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
      vendorType: vendor.vendorType,
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

    const orders = await WorkOrder.find(filter).sort({
      createdAt: -1,
    });

    return res.json(orders);
  } catch (error) {
    console.error("Fetch work orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch work orders.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      vendorId,
      category,
      subcategory,
      site,
      workDescription,
      quantity,
      unit,
      rate,
      startDate,
      deadline,
      measurementType,
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

    if (vendor.status !== "approved") {
      return res.status(403).json({
        message: "Only approved vendors can receive Work Orders.",
      });
    }

    const registeredCategory = getVendorCategory(vendor);
    const allowedCategories = getAllowedCategories(vendor);

    if (!allowedCategories.includes(registeredCategory)) {
      return res.status(400).json({
        message: "Vendor type or registered category is invalid.",
      });
    }
    if (String(category || "").trim() !== registeredCategory) {
      return res.status(400).json({
        message: "Category must match the vendor's registered category.",
      });
    }

    const allowedSubcategories =
      SUBCATEGORIES[registeredCategory] || [];

    const selectedSubcategory = String(subcategory || "").trim();

    if (
      !selectedSubcategory ||
      selectedSubcategory.length > 150
    ) {
      return res.status(400).json({
        message: "Please provide a valid subcategory.",
      });
    }

    if (selectedSubcategory === "Other") {
      return res.status(400).json({
        message: "Please enter the custom subcategory instead of Other.",
      });
    }

    const isPredefinedSubcategory =
      allowedSubcategories.includes(selectedSubcategory);

    const allowsCustomSubcategory =
      allowedSubcategories.includes("Other");

    if (!isPredefinedSubcategory && !allowsCustomSubcategory) {
      return res.status(400).json({
        message: "Invalid subcategory for this vendor category.",
      });
    }

    const cleanSite = String(site || "").trim();
    const cleanDescription = String(workDescription || "").trim();
    const cleanUnit = String(unit || "").trim();

    if (
      !cleanSite ||
      !cleanDescription ||
      !cleanUnit ||
      quantity === undefined ||
      quantity === "" ||
      rate === undefined ||
      rate === "" ||
      !startDate ||
      !deadline
    ) {
      return res.status(400).json({
        message: "Please fill all required Work Order fields.",
      });
    }

    const numericQuantity = Number(quantity);
    const numericRate = Number(rate);

    if (
      !Number.isFinite(numericQuantity) ||
      !Number.isFinite(numericRate) ||
      numericQuantity <= 0 ||
      numericRate < 0
    ) {
      return res.status(400).json({
        message:
          "Quantity must be greater than zero and rate cannot be negative.",
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

    const validMeasurementTypes = ["fixed", "calculating"];
    const selectedMeasurementType = measurementType || "fixed";

    if (!validMeasurementTypes.includes(selectedMeasurementType)) {
      return res.status(400).json({
        message: "Invalid measurement type.",
      });
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
      quantity: numericQuantity,
      unit: cleanUnit,
      rate: numericRate,
      totalAmount: numericQuantity * numericRate,
      startDate: start,
      deadline: end,
      measurementType: selectedMeasurementType,
      status: "Issued",
      createdBy: String(createdBy || "Admin").trim(),
    });

    return res.status(201).json({
      message: "Work Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Create work order error:", error);

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
