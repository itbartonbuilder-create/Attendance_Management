import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    site: { type: String, required: true },
    contactNo: { type: String, required: true },
    salary: { type: Number, required: true },

    aadhaarDoc: {
      url: String,
      public_id: String,
    },

    panDoc: {
      url: String,
      public_id: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
