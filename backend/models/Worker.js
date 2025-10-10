import mongoose from "mongoose";

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roleType: { type: String, required: true },
  role: { type: String, required: true },
  site: { type: String, required: true },
  contactNo: { type: String, required: true },
  perDaySalary: { type: Number, required: true },
   
});

export default mongoose.model("Worker", WorkerSchema);
