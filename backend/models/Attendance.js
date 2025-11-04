import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  site: { type: String, required: true },
  records: [
    {
      workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
      name: { type: String, required: true },
      roleType: { type: String, required: true },
      role: { type: String, required: true },
      status: { type: String, enum: ["Present", "Absent", "Leave"], required: true },
    },
  ],
});

// ✅ Ensure combination of date + site is unique (no overwrite across sites)
AttendanceSchema.index({ date: 1, site: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
