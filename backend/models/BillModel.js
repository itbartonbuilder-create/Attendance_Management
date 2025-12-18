import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    workName: { type: String, required: true },
    billNo: { type: String, required: true },
    site: { type: String, required: true },
    sentTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    amount: { type: Number, required: true },
    billDate: { type: Date, required: true }, 
    billFile: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
