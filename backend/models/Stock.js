import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    site: String,
    category: String,
    material: String,
    unit: String,

    totalStock: Number,
    usedStock: Number,
    remainingStock: Number,

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Stock", stockSchema);
