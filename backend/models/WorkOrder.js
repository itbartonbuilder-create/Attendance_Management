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
    measurementIds: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SiteMeasurement",
  },
],
    rateApprovals: [
  {
    measurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SiteMeasurement",
      required: true,
    },

    rate: {
      type: Number,
      default: null,
      min: 0,
    },

    amount: {
      type: Number,
      default: null,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Rate Pending", "Approved", "Revision Required"],
      default: "Rate Pending",
    },

    approvedBy: {
      type: String,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    history: [
      {
        rate: {
          type: Number,
          required: true,
          min: 0,
        },

        amount: {
          type: Number,
          required: true,
          min: 0,
        },

        status: {
          type: String,
          enum: ["Rate Pending", "Approved", "Revision Required"],
          required: true,
        },

        changedBy: {
          type: String,
          default: "Admin",
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
],

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
    subcategory: {
    type: String,
    required: true,
    trim: true,
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
