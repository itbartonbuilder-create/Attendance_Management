import mongoose from "mongoose";

const MeasurementSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      required: true,
      trim: true,
    },

    workType: {
      type: String,
      required: true,
      trim: true,
    },

    length: {
      type: Number,
      default: 0,
    },

    breadth: {
      type: Number,
      default: 0,
    },

    height: {
      type: Number,
      default: 0,
    },

    unitWeight: {
      type: Number,
      default: null,
    },

    measurementUnit: {
      type: String,
      enum: ["m", "ft", "in", "Rft"],
      default: "m",
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "SiteMeasurement",
  MeasurementSchema
);
