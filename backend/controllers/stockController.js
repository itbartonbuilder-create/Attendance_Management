import Stock from "../models/Stock.js";

export const createStock = async (req, res) => {
  try {
    const { site, category, material, unit, addStock, usedStock } = req.body;

    if (!site || !category || !material || !unit) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const add = Number(addStock || 0);
    const used = Number(usedStock || 0);

    if (used > add && add === 0) {
      return res.status(400).json({
        success: false,
        message: "Used cannot exceed available stock",
      });
    }

    // 🟢 Always create NEW entry (no overwrite)
    const newStock = await Stock.create({
      site,
      category,
      material,
      unit,
      totalStock: add,
      usedStock: used,
      remainingStock: add - used,
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Stock Entry Saved",
      data: newStock,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getAllStocks = async (req, res) => {
  try {
    const { site } = req.query;

    const filter = site ? { site } : {};

    const stocks = await Stock.find(filter).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
