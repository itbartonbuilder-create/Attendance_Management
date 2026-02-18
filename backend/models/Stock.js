import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },
    category: { type: String, required: true },
    material: { type: String, required: true },
    unit: { type: String, required: true },

    totalStock: { type: Number, required: true, default: 0 },
    usedStock: { type: Number, required: true, default: 0 },
    remainingStock: { type: Number, required: true, default: 0 },

    date: {
      type: Date,
      default: Date.now,   
    },
  },
  { timestamps: true }
);

export default mongoose.model("Stock", stockSchema);
