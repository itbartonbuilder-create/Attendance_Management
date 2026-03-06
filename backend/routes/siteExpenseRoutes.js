import express from "express";
import SiteExpense from "../models/SiteExpense.js";
import { uploadSiteExpense } from "../middleware/upload.js";

const router = express.Router();



router.post("/", uploadSiteExpense.single("bill"), async (req, res) => {

  try {

    const expense = new SiteExpense({

      siteId: req.body.siteId,
      date: req.body.date,
      particular: req.body.particular,
      inAmount: req.body.inAmount || 0,
      outAmount: req.body.outAmount || 0,

    
      billImage: req.file ? req.file.path : ""

    });

    await expense.save();

    res.json(expense);

  } 
  catch (err) {

    res.status(500).json({ error: err.message });

  }

});


router.get("/", async (req, res) => {

  try {

    const { siteId } = req.query;

    const expenses = await SiteExpense
      .find({ siteId })
      .sort({ date: 1 });

    res.json(expenses);

  } 
  catch (err) {

    res.status(500).json({ error: err.message });

  }

});

export default router;
