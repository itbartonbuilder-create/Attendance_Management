import mongoose from "mongoose";

const WorkerPaymentSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: true
  },
  site: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  note: String
}, { timestamps: true });

export default mongoose.model("WorkerPayment", WorkerPaymentSchema);
