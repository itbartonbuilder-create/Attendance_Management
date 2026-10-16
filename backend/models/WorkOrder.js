
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
      required: true,
      index: true,
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
      enum: [
        "Composite",
        "Civil",
        "Electrical",
        "Aggregate",
        "Sand",
        "Cement",
        "Hardware",
        "Tiles",
        "Steel",
        "Paints",
        "Wood",
        "Glass",
        "Other",
      ],
      required: true,
      trim: true,
    },

    subcategory: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
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
      required: true,
    },

    status: {
      type: String,
      enum: ["Issued", "In Progress", "Completed", "Cancelled"],
      default: "Issued",
    },

    createdBy: {
      type: String,
      default: "Admin",
      trim: true,
    },
  },
  { timestamps: true }
);

workOrderSchema.index({ site: 1, createdAt: -1 });

export default mongoose.model("WorkOrder", workOrderSchema);
