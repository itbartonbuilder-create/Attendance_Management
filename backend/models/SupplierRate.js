import mongoose from "mongoose";

const supplierRateSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

supplierRateSchema.index({
  supplierName: "text",
  category: "text",
  description: "text",
});

export default mongoose.model("SupplierRate", supplierRateSchema);
