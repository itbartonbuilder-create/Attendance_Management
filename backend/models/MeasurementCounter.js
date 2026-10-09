
import mongoose from "mongoose";

const MeasurementCounterSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    seq: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "MeasurementCounter",
  MeasurementCounterSchema
);
