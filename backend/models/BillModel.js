import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },

  workName: String,
  billNo: String,
  site: String,
  sentTo: String,
  amount: Number,
  billDate: Date,

  billFile: String, // file path
  status: { type: String, default: "Pending" },
}, { timestamps: true });

export default mongoose.model("Bill", billSchema);
