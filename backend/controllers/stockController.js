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

    if (!site || !category || !material || !unit) {
      return res.status(400).json({ message: "All fields required" });
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
    const stocks = await Stock.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
