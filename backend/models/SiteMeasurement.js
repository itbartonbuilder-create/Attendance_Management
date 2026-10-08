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
      default: null,
    },

    breadth: {
      type: Number,
      default: null,
    },

    height: {
      type: Number,
      default: null,
    },

    unitWeight: {
      type: Number,
      default: null,
    },

    measurementUnit: {
      type: String,
      default: "m",
      trim: true,
    },

   
    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
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
