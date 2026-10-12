import mongoose from "mongoose";

const FixedMeasurementRateSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    workType: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);
FixedMeasurementRateSchema.index(
  {
    site: 1,
    workType: 1,
    description: 1,
    unit: 1,
  },
  {
    unique: true,
  }
);
export default mongoose.model(
  "FixedMeasurementRate",
  FixedMeasurementRateSchema
);
