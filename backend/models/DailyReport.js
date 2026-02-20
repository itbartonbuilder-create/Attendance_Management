import mongoose from "mongoose";

const dailyReportSchema = new mongoose.Schema({
  date: String,
  userId: String,
  site: String,

  morningText: String,
  eveningText: String,

  morningPhotos: [String],
  eveningPhotos: [String],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("DailyReport", dailyReportSchema);
