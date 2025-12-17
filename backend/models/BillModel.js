
import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    workName: String,
    billNo: String,
    site: String,

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },

    amount: Number,
    billDate: String,
    billFile: String,
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
