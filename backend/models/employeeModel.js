import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    role: { type: String, required: true }, // Engineer, Supervisor etc

    site: { type: String, required: true },

    contactNo: { type: String, required: true },

    aadhaarNumber: { type: String, required: true },

    panNumber: { type: String, required: true },

    salary: { type: Number, required: true },

    aadhaarDoc: { type: String }, 
    panDoc: { type: String },     
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
