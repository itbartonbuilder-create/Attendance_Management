import Stock from "../models/Stock.js";

export const createStock = async (req, res) => {
  try {
    const {
      site,
      category,
      material,
      unit,
      totalStock,
      usedStock,
    } = req.body;

    if (
      !site ||
      !category ||
      !material ||
      !unit ||
      totalStock === undefined ||
      usedStock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (usedStock > totalStock) {
      return res.status(400).json({
        success: false,
        message: "Used stock cannot be greater than total",
      });
    }

    const remainingStock = totalStock - usedStock;

    const stock = await Stock.create({
      site,
      category,
      material,
      unit,
      totalStock,
      usedStock,
      remainingStock,
    });

    res.status(201).json({
      success: true,
      message: "Stock saved successfully",
      data: stock,
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

    let filter = {};

    // 🔐 agar site aayi hai → sirf usi site ka data
    if (site) {
      filter.site = site;
    }

    const stocks = await Stock.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
