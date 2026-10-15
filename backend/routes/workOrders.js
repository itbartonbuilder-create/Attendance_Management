import express from "express";
import mongoose from "mongoose";
import WorkOrder from "../models/WorkOrder.js";

const router = express.Router();
function normalizeVendor(vendor) {
  if (!vendor) return null;

  return {
    _id: vendor._id,
    name:
      vendor.name ||
      vendor.vendorName ||
      vendor.fullName ||
      vendor.companyName ||
      "",
    mobile:
      vendor.mobile ||
      vendor.mobileNumber ||
      vendor.phone ||
      vendor.contactNumber ||
      "",
    email: vendor.email || "",
    address: vendor.address || "",
    gstNumber: vendor.gstNumber || vendor.gstNo || "",
  };
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
    const mobile = String(req.query.mobile || "")
      .replace(/\D/g, "")
      .trim();

    if (!mobile) {
      return res.status(400).json({
        message: "Vendor mobile number is required",
      });
    }

    const vendorsCollection =
      mongoose.connection.collection("vendors");

    const mobileFields = [
      "mobile",
      "mobileNumber",
      "phone",
      "contactNumber",
    ];

    const vendor = await vendorsCollection.findOne({
      $or: mobileFields.map((field) => ({
        [field]: mobile,
      })),
    });

    if (!vendor) {
      return res.status(404).json({
        message: "Registered vendor not found",
      });
    }

    return res.json({
      _id: vendor._id,
      name:
        vendor.name ||
        vendor.vendorName ||
        vendor.fullName ||
        vendor.companyName ||
        "",
      mobile:
        vendor.mobile ||
        vendor.mobileNumber ||
        vendor.phone ||
        vendor.contactNumber ||
        "",
      email: vendor.email || "",
      address: vendor.address || "",
      gstNumber: vendor.gstNumber || vendor.gstNo || "",
    });
  } catch (error) {
    console.error("Vendor search error:", error);

    return res.status(500).json({
      message: "Failed to search vendor",
    });
  }
});router.get("/", async (req, res) => {
  try {
    const { site, status, category } = req.query;

    const filter = {};

    if (site) filter.site = site;
    if (category) filter.category = category;
    if (status && status !== "All") filter.status = status;

    const orders = await WorkOrder.find(filter).sort({
      createdAt: -1,
    });

    return res.json(orders);
  } catch (error) {
    console.error("Fetch work orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch work orders",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      vendorId,
      vendorName,
      vendorMobile,
      category,
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

    if (
      !vendorName ||
      !vendorMobile ||
      !category ||
      !site ||
      !workDescription ||
      quantity === undefined ||
      quantity === "" ||
      rate === undefined ||
      rate === "" ||
      !unit ||
      !startDate ||
      !deadline
    ) {
      return res.status(400).json({
        message: "Please fill all required work order fields",
      });
    }

    if (!["Composite", "Civil", "Electrical"].includes(category)) {
      return res.status(400).json({
        message: "Invalid work category",
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
        message: "Quantity must be greater than zero and rate cannot be negative",
      });
    }

    const start = new Date(startDate);
    const end = new Date(deadline);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid start date or deadline",
      });
    }

    if (end < start) {
      return res.status(400).json({
        message: "Deadline cannot be before start date",
      });
    }

    const validMeasurementTypes = ["fixed", "calculating"];
    const selectedMeasurementType = measurementType || "fixed";

    if (!validMeasurementTypes.includes(selectedMeasurementType)) {
      return res.status(400).json({
        message: "Invalid measurement type",
      });
    }

    const orderNumber = await generateOrderNumber();

    const order = await WorkOrder.create({
      orderNumber,
      vendorId:
        vendorId && mongoose.isValidObjectId(vendorId)
          ? vendorId
          : null,
      vendorName: String(vendorName).trim(),
      vendorMobile: String(vendorMobile).trim(),
      category,
      site: String(site).trim(),
      workDescription: String(workDescription).trim(),
      quantity: numericQuantity,
      unit: String(unit).trim(),
      rate: numericRate,
      totalAmount: numericQuantity * numericRate,
      startDate: start,
      deadline: end,
      measurementType: selectedMeasurementType,
      status: "Issued",
      createdBy: createdBy || "Admin",
    });

    return res.status(201).json({
      message: "Work order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create work order error:", error);

    return res.status(500).json({
      message: "Failed to create work order",
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
        message: "Invalid work order ID",
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
        message: "Invalid work order status",
      });
    }

    const order = await WorkOrder.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Work order not found",
      });
    }

    return res.json({
      message: "Work order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update work order status error:", error);

    return res.status(500).json({
      message: "Failed to update work order status",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid work order ID",
      });
    }

    const order = await WorkOrder.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        message: "Work order not found",
      });
    }

    return res.json({
      message: "Work order deleted successfully",
    });
  } catch (error) {
    console.error("Delete work order error:", error);

    return res.status(500).json({
      message: "Failed to delete work order",
    });
  }
});

export default router;
