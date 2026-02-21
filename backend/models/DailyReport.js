import mongoose from "mongoose";

const dailyReportSchema = new mongoose.Schema({
  date: { type: String, required: true },

  siteId: { type: String, required: true },   

  morningText: { type: String, default: "" },
  eveningText: { type: String, default: "" },

  morningPhotos: { type: [String], default: [] },
  eveningPhotos: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now },
});


dailyReportSchema.index({ date: 1, siteId: 1 }, { unique: true });

export default mongoose.model("DailyReport", dailyReportSchema);
