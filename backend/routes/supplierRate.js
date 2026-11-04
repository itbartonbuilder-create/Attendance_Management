
import express from "express";
import mongoose from "mongoose";
import SupplierRate from "../models/SupplierRate.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();


const getActor = (req) => req.user || req.currentUser || null;


const getRole = (actor) =>
  String(
    actor?.role ||
    actor?.userType ||
    actor?.type ||
    actor?.designation ||
    ""
  ).toLowerCase().trim();

const isAdmin = (actor) =>
  ["admin", "superadmin", "super admin"].includes(getRole(actor));

const isManager = (actor) =>
  getRole(actor).includes("manager");


const actorId = (actor) =>
  actor?._id || actor?.id || actor?.userId || null;


const requireAccess = (req, res, next) => {
  const actor = getActor(req);

  if (!actor) {
    return res.status(401).json({
      success: false,
      message: "Authentication user not found.",
    });
  }

  if (!isAdmin(actor) && !isManager(actor)) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to access Supplier Rate.",
    });
  }

  if (isManager(actor) && !actorId(actor)) {
    return res.status(401).json({
      success: false,
      message: "Manager ID missing from authentication token.",
    });
  }

  req.supplierRateActor = actor;
  next();
};

router.use(authMiddleware);
router.use(requireAccess);

const cleanText = (value) =>
  String(value ?? "").trim();

const validatePayload = (body = {}) => {
  const required = [
    "supplierName",
    "category",
    "description",
  ];

  for (const field of required) {
    if (!cleanText(body[field])) {
      return `${field} is required`;
    }
  }

  const amount = Number(body.amount);

  if (
    body.amount === "" ||
    body.amount === undefined ||
    body.amount === null ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return "Please enter a valid amount";
  }

  if (
    !body.purchaseDate ||
    Number.isNaN(new Date(body.purchaseDate).getTime())
  ) {
    return "Please enter a valid purchase date";
  }

  return null;
};

const buildPayload = (body) => ({
  supplierName: cleanText(body.supplierName),
  category: cleanText(body.category),
  description: cleanText(body.description),
  amount: Number(body.amount),
  purchaseDate: new Date(body.purchaseDate),
});


const canManageRecord = (actor, record) => {
  if (isAdmin(actor)) return true;

  return (
    isManager(actor) &&
    String(record.createdBy || "") === String(actorId(actor))
  );
};


router.get("/summary", async (req, res) => {
  try {
    const [
      totalRecords,
      suppliers,
      categories,
      totalAmount,
    ] = await Promise.all([
      SupplierRate.countDocuments(),
      SupplierRate.distinct("supplierName"),
      SupplierRate.distinct("category"),
      SupplierRate.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        totalRecords,
        totalSuppliers: suppliers.length,
        totalCategories: categories.length,
        totalAmount: totalAmount[0]?.total || 0,
      },
    });

  } catch (error) {
    console.error("SUPPLIER RATE SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load supplier summary",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
    } = req.query;

    const filter = {};

    if (cleanText(category)) {
      filter.category = cleanText(category);
    }

    if (cleanText(search)) {
      const escaped = cleanText(search).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { supplierName: regex },
        { category: regex },
        { description: regex },
      ];
    }

    const rows = await SupplierRate.find(filter)
      .sort({
        purchaseDate: -1,
        createdAt: -1,
      })
      .limit(1000)
      .lean();

    const actor = req.supplierRateActor;

    const data = rows.map((row) => ({
      ...row,
      canEdit: canManageRecord(actor, row),
      canDelete: isAdmin(actor),
    }));

    return res.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("GET SUPPLIER RATES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier records",
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const actor = req.supplierRateActor;

    const validationError = validatePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const payload = buildPayload(req.body);

    const saved = await SupplierRate.create({
      ...payload,
      createdBy: isManager(actor) ? actorId(actor) : null,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier record added successfully",
      data: saved,
    });

  } catch (error) {
    console.error("CREATE SUPPLIER RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add supplier record",
      error: error.message,
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid record ID",
      });
    }

    const actor = req.supplierRateActor;

    const record = await SupplierRate.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Supplier record not found",
      });
    }

    if (!canManageRecord(actor, record)) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this supplier record.",
      });
    }

    const validationError = validatePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    Object.assign(record, buildPayload(req.body));

    await record.save();

    return res.json({
      success: true,
      message: "Supplier record updated successfully",
      data: record,
    });

  } catch (error) {
    console.error("UPDATE SUPPLIER RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update supplier record",
      error: error.message,
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const actor = req.supplierRateActor;

    if (!isAdmin(actor)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can delete supplier records.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid record ID",
      });
    }

    const deleted = await SupplierRate.findByIdAndDelete(
      req.params.id
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Supplier record not found",
      });
    }

    return res.json({
      success: true,
      message: "Supplier record deleted successfully",
    });

  } catch (error) {
    console.error("DELETE SUPPLIER RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier record",
      error: error.message,
    });
  }
});

export default router;
