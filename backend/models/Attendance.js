import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  site: { type: String, required: true },

  records: [
    {
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        required: true
      },

      name: String,
      roleType: String,
      role: String,

      type: {
        type: String,
        enum: ["worker", "employee"],
        required: true
      },

      status: {
        type: String,
        enum: ["Present", "Absent", "Leave"],
        required: true
      },

      hoursWorked: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      salary: { type: Number, default: 0 },

      leaveType: {
        holiday: { type: Boolean, default: false },
        accepted: { type: Boolean, default: false },
      },
    }
  ],
});

AttendanceSchema.index({ site: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
