import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    contactNo: {
      type: String,
      required: true,
      unique: true,
    },

    aadharNumber: {
      type: String,
      required: true,
      minlength: 12,
      maxlength: 12,
    },

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
    },

    vendorType: {
      type: String,
      enum: ["supply", "work"],
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    gstNumber: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "vendor",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
