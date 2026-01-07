import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    workName: { type: String, required: true },

    billNo: { type: String, required: true },

    site: { type: String, required: true },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: { type: Number, required: true },

    billDate: { type: Date, required: true },

    billFile: { type: String, required: true },

    billFileId: { type: String, required: true },
  },
  { timestamps: true } // 🔥 THIS FIXES 500
);

export default mongoose.model("Bill", billSchema);
