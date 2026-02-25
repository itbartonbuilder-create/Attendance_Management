import mongoose from "mongoose";

const reassignSchema = new mongoose.Schema({
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "reassignHistory.type",
  },
  type: { type: String, enum: ["Manager", "Worker"] },
  reassignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  reassignedAt: { type: Date, default: Date.now },
  deadline: String,
});

const taskSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },

    type: { type: String, required: true, enum: ["Manager", "Worker"] },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },

    title: { type: String, required: true },
    description: String,

    deadline: { type: String, required: true },
    assignedDate: { type: Date, default: Date.now },

    isCompleted: { type: Boolean, default: false },

    completedAt: { type: Date, default: null },

    reassignHistory: [reassignSchema],

    remark: {
      type: String,
      enum: ["Completed", "Not Completed", "Delay", ""],
      default: "",
    },

    reason: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Not Completed"],
      default: "Pending",
    },
    statusUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
