import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },
    type: { type: String, required: true, enum: ["Manager", "Worker"] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "type" },
    title: { type: String, required: true },
    description: { type: String },
    deadline: { type: String, required: true },
    remark: { type: String, enum: ["Completed", "Not Completed", "Delay", ""], default: "" },
    reason: { type: String, default: "" },
    remarkBy: { type: mongoose.Schema.Types.ObjectId, refPath: "type", default: null },
    remarkStatus: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
    adminRejectReason: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
