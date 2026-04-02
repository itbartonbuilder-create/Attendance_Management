import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
{
  workName: String,
  billNo: { type: Number, unique: true },
  site: String,

vendor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Vendor",
  required: function () {
    return this.site !== "office";
  },
},
sentTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Manager",
  required: function () {
    return this.site !== "office";
  },
},


  amount: Number,
  quantity: Number,
  gstType: {
    type: String,
    enum: ["gst", "non-gst"],
    default: "non-gst"
  },
  gstPercent: Number,
  gstAmount: Number,
  totalAmount: Number,

  billDate: Date,
  billFile: String,
  billFileId: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
},
{ timestamps: true }
);

export default mongoose.model("Bill", billSchema);
