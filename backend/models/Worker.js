import mongoose from "mongoose";

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roleType: { type: String, required: true },
  role: { type: String, required: true },
  site: { type: String, required: true },
  contactNo: { type: String, required: true },
  perDaySalary: { type: Number, required: true },

   latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  lastLocationUpdate: {
    type: Date
  },
  locationName: {
  type: String,
  default: null
},
  locationHistory: [
    {
      latitude: Number,
      longitude: Number,
      locationName: String,
      date: String,
      time: Date,
    }
  ]
   
});

export default mongoose.model("Worker", WorkerSchema);
