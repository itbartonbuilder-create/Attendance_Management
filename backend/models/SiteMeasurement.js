import mongoose from "mongoose";

const MeasurementSchema = new mongoose.Schema({
  site: {
    type: String,
    required: true
  },
  workType: {
    type: String,
    required: true
  },
  length: Number,
  breadth: Number,
  height: Number,

  quantity: {
    type: Number,
    required: true
  },

  unit: {            
    type: String,
    required: true
  },

  remarks: String,

  date: {
    type: Date,
    required: true
  }

}, { timestamps: true });

export default mongoose.model("SiteMeasurement", MeasurementSchema);
