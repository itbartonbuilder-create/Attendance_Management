import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
  voucherNo: { type: String, required: true, unique: true },
  payableTo: { type: String, required: true },
  particulars: { type: String, required: true },
  paymentMode: { type: String, required: true },
 screenshotUrl: { type: String, default: "" },
  amount: { type: Number, required: true },
  amountInWords: { type: String, required: true },
  site: { type: String, required: true },          
  createdByName: { type: String, required: true },  
  createdByUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const Voucher = mongoose.model("Voucher", voucherSchema);
export default Voucher;
