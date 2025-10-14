import mongoose from "mongoose";

const ManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  site: { type: String, required: true },
});

export default mongoose.model("Manager", ManagerSchema);
