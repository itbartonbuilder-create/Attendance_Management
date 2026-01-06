// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNo: { type: String },
  email: { type: String },
  password: { type: String },
  role: {
    type: String,
    enum: ["admin", "manager", "worker"],
    required: true
  },
  site: {
    type: String,
    required: function () {
      return this.role !== "admin";
    }
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Manager",
    default: null
  }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
