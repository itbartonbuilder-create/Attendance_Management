import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },
    category: { type: String, required: true },
    material: { type: String, required: true },
    unit: { type: String, required: true },
    totalStock: { type: Number, required: true },
    usedStock: { type: Number, required: true },
    remainingStock: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Stock", stockSchema);
