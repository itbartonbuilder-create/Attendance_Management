import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    workName: String,

    billNo: {
      type: String,
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
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
