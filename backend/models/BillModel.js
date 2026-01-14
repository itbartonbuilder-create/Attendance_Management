import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    workName: String,

    billNo: {
      type: Number,
      unique: true,
    },

    site: String,

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },

    amount: Number,
    billDate: Date,

    billFile: String,
    billFileId: String,

    // ✅ MISSING FIELD (VERY IMPORTANT)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
