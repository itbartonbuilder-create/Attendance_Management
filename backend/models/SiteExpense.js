import mongoose from "mongoose";

const SiteExpenseSchema = new mongoose.Schema({

  siteId: {
    type: String,
    required: true
  },

  date: {
    type: String,
    required: true
  },

  particular: {
    type: String,
    required: true
  },

  inAmount: {
    type: Number,
    default: 0
  },

  outAmount: {
    type: Number,
    default: 0
  },

  billImage: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

const SiteExpense = mongoose.model("SiteExpense", SiteExpenseSchema);

export default SiteExpense;
