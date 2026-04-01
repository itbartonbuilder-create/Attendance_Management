import mongoose from "mongoose";

const ManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  site: { type: String, required: true },

  aadhaarDoc: {
    url: { type: String },
    public_id: { type: String },
  },
  panDoc: {
    url: { type: String },
    public_id: { type: String },
  },
  weatherCity: {
  type: String,
  required: true
},

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
}, { timestamps: true }); 

export default mongoose.model("Manager", ManagerSchema);
