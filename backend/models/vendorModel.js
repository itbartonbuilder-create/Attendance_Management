import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    companyName: String,
    contactNo: { type: String, required: true, unique: true },

    aadharNumber: { type: String, required: true, length: 12 },
    panNumber: { type: String, required: true },

    vendorType: { type: String, enum: ["supply", "work"], required: true },
    category: { type: String, required: true },
    gstNumber: String,

    password: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },

    vendorCode: {
      type: String, 
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
