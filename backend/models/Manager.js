import mongoose from "mongoose";

const ManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  site: { type: String, required: true },

  // Optional documents
  aadhaarDoc: {
    url: { type: String },
    public_id: { type: String },
  },
  panDoc: {
    url: { type: String },
    public_id: { type: String },
  },
}, { timestamps: true }); 

export default mongoose.model("Manager", ManagerSchema);
