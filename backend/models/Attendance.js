import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  records: [
    {
      workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },  
      role: { type: String, required: true },  
      status: { type: String, enum: ["Present", "Absent", "Leave"], required: true },
    }
  ],
});

export default mongoose.model("Attendance", AttendanceSchema);
