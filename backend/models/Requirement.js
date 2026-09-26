import mongoose from "mongoose";
const requirementSchema = new mongoose.Schema(
      {
      site: {
        type: String,
        required: true,
        index: true,
      },
      date: {
        type: Date,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      material: {
        type: String,
        required: true,
      },
      unit: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      // availableStock: {
      //   type: Number,
      //   default: 0,
      // },
      // shortageQuantity: {
      //   type: Number,
      //   default: 0,
      // },
      requiredDate: {
        type: Date,
        required: true,
      },
               priority: {
      type: String,
      enum: ["Normal", "Urgent", "Critical"],
      default: "Normal",
    },

      purpose: {
        type: String,
        default: "",
      },
   
    },

  );

export default mongoose.model(
  "Requirement",
  requirementSchema
);
