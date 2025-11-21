import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },  
    type: { type: String, required: true },  // Manager / Worker

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },

    title: { type: String, required: true },
    description: { type: String },
    // priority: { type: String, default: "Medium" },
    deadline: { type: String, required: true },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
