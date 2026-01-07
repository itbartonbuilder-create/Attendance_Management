import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    workName: {
      type: String,
      required: true,
      trim: true,
    },

    billNo: {
      type: String,
      required: true,
      unique: true, 
      index: true,
    },

    site: {
      type: String,
      required: true,
    },

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

    amount: {
      type: Number,
      required: true,
    },

    billDate: {
      type: Date,
      required: true,
    },

   
    billFile: {
      type: String,
      required: true,
    },

    
    billFileId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Bill", billSchema);
