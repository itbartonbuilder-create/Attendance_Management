
import mongoose from "mongoose";

const vendorpaymentbill = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
      index: true,
    },

    orderNumber: { type: String, required: true },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    vendorName: { type: String, required: true },
    vendorMobile: { type: String, default: "" },
    site: { type: String, required: true },

    items: [
      {
        description: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, default: "" },
        rate: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],

    approvedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    previouslyPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: [
        "Cash",
        "UPI / Online",
      ],
      default: "Cash",
    },

    paymentProofUrl: {
      type: String,
      default: "",
    },

    paymentProofPublicId: {
      type: String,
      default: "",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    remarks: { type: String, default: "" },
    createdBy: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

vendorpaymentbill.index({ workOrderId: 1, createdAt: -1 });


const VendorPaymentBill =
  mongoose.models.VendorPaymentBill ||
  mongoose.model("VendorPaymentBill", vendorpaymentbill);

export default VendorPaymentBill;

