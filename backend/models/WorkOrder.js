import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    vendorName: {
      type: String,
      required: true,
      trim: true,
    },

    vendorMobile: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Composite", "Civil", "Electrical"],
      required: true,
    },

    site: {
      type: String,
      required: true,
      trim: true,
    },

    workDescription: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    deadline: {
      type: Date,
      required: true,
    },

    measurementType: {
      type: String,
      enum: ["fixed", "calculating"],
      default: "fixed",
    },

    status: {
      type: String,
      enum: ["Issued", "In Progress", "Completed", "Cancelled"],
      default: "Issued",
    },

    createdBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model("WorkOrder", workOrderSchema);
