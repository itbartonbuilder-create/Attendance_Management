import Stock from "../models/Stock.js";

export const createStock = async (req, res) => {
  try {
    const { site, category, material, unit, addStock, usedStock } = req.body;

    const add = Number(addStock || 0);
    const used = Number(usedStock || 0);
const previousStock = await Stock.findOne({ site, material })
  .sort({ createdAt: -1 });

const previousRemaining = previousStock
  ? previousStock.remainingStock
  : 0;


    const newTotal = previousRemaining + add;

    if (used > newTotal) {
      return res.status(400).json({
        success: false,
        message: "Used cannot exceed available stock",
      });
    }

    const newRemaining = newTotal - used;

    const newStock = await Stock.create({
      site,
      category,
      material,
      unit,
      totalStock: newTotal,
      usedStock: used,
      remainingStock: newRemaining,
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

    const stocks = await Stock.find(filter).sort({ createdAt: -1 });

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
