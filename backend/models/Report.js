import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  site: { type: String, required: true }, // ✅ add site field (needed for reports)
  records: [
    {
      workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      roleType: { type: String },
      role: { type: String, required: true },
      status: { type: String, enum: ["Present", "Absent", "Leave"], required: true },
      hoursWorked: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 }, // ✅ new field
      salary: { type: Number, default: 0 },
    },
  ],
});

export default mongoose.model("Attendance", AttendanceSchema);
