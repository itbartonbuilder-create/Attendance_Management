import mongoose from "mongoose";

const dailyReportSchema = new mongoose.Schema({
  date: String,
  siteId: { type: String, required: true }, 

  morningText: { type: String, default: "" },
  eveningText: { type: String, default: "" },

  morningPhotos: { type: [String], default: [] },
  eveningPhotos: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("DailyReport", dailyReportSchema);
