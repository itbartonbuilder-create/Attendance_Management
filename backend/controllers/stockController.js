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

    let stock = await Stock.findOne({ site, material });

    if (stock) {

     
      if (addStock) {
        stock.totalStock += Number(addStock);
      }

      
      if (usedStock) {

        if (stock.remainingStock < usedStock) {
          return res.status(400).json({
            success: false,
            message: "Not enough stock available",
          });
        }

        stock.usedStock += Number(usedStock);
      }

      stock.remainingStock = stock.totalStock - stock.usedStock;
      stock.date = new Date();

      await stock.save();

      return res.json({
        success: true,
        message: "Stock Updated",
        data: stock,
      });
    }


    const total = Number(addStock || 0);
    const used = Number(usedStock || 0);

    if (used > total) {
      return res.status(400).json({
        success: false,
        message: "Used cannot exceed total",
      });
    }

    const newStock = await Stock.create({
      site,
      category,
      material,
      unit,
      totalStock: total,
      usedStock: used,
      remainingStock: total - used,
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Stock Created",
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
