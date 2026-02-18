import Stock from "../models/Stock.js";

export const createStock = async (req, res) => {
  try {
    const { site, category, material, unit, totalStock, usedStock } = req.body;

    if (!site || !category || !material || !unit) {
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

    let existingStock = await Stock.findOne({ site, material });

    
    if (existingStock) {
      existingStock.totalStock += Number(totalStock);
      existingStock.usedStock += Number(usedStock);

      if (existingStock.usedStock > existingStock.totalStock) {
        return res.status(400).json({
          success: false,
          message: "Used stock exceeds total stock",
        });
      }

      existingStock.remainingStock =
        existingStock.totalStock - existingStock.usedStock;

      existingStock.date = new Date();

      await existingStock.save();

      return res.status(200).json({
        success: true,
        message: "Stock Updated Successfully",
        data: existingStock,
      });
    }

    // 🆕 CREATE new stock
    const remainingStock = totalStock - usedStock;

    const stock = await Stock.create({
      site,
      category,
      material,
      unit,
      totalStock,
      usedStock,
      remainingStock,
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Stock Created Successfully",
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
    if (site) filter.site = site;

    const stocks = await Stock.find(filter).sort({ updatedAt: -1 });

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
