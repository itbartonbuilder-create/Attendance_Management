import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },

  amount: Number,      
  gstPercent: { type: Number, default: 0 },
  gstAmount: Number,  
  total: Number       
});


const billSchema = new mongoose.Schema(
{
  billNo: { type: Number, unique: true },
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

  items: [itemSchema],


  billSubtotal: Number,
  billGSTTotal: Number,
  billGrandTotal: Number,

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
