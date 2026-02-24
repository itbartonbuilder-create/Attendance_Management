import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },

    type: {
      type: String,
      required: true,
      enum: ["Manager", "Worker"],
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },

    title: { type: String, required: true },
    description: String,

    assignedDate: {
      type: String,
      default: () =>
        new Date().toISOString().split("T")[0],
    },

    deadline: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Reassigned"],
      default: "Pending",
    },

    completedAt: String,

    reassignedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "type",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
