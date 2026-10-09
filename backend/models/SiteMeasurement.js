import mongoose from "mongoose";

const MeasurementSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      required: true,
      trim: true,
    },

    measurementNo: {
      type: String,
      default: undefined,
      trim: true,
    },

    batchId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },

    workType: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
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

MeasurementSchema.index(
  {
    site: 1,
    measurementNo: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      measurementNo: { $type: "string" },
    },
  }
);

export default mongoose.model(
  "SiteMeasurement",
  MeasurementSchema
);
