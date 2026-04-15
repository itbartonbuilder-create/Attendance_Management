import mongoose from "mongoose";

const MeasurementSchema = new mongoose.Schema({
  site: String,
  workType: String,
  length: Number,
  breadth: Number,
  height: Number,
  quantity: Number,
  remarks: String,
  date: Date
}, {
  timestamps: true
});

const SiteMeasurement = mongoose.model("SiteMeasurement", MeasurementSchema);

export default SiteMeasurement;
