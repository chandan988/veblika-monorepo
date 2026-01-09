import mongoose, { Schema, Document } from "mongoose";

export interface IOrganisation extends Document {
  name: string;
  website?: string;
  logo?: string;
  industry?: string;
  country: string;
  state: string;
  city: string;
  timeZone: string;
  location:{
    lat: number;
    lng: number;
  }
  settings: {
    weekStartDay: string;
    workingDays: string[];
    currency: string;
    dateFormat: string;
  };
  ownerId: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
}

const OrganisationSchema = new Schema<IOrganisation>(
 {
    name: { type: String, required: true },
    website: { type: String, required: false },
    logo: { type: String, required: false },
    industry: {type:String,required:false},
    country: { type: String, default: "India" },
    state: { type: String, default: "",required:true },
    city: { type: String, default: "" ,required:true},
    timeZone: { type: String, default: "Asia/Kolkata" },
    location: {
     type:String, required:false
    },
    settings: {
      weekStartDay: { type: String, default: "Monday" },
      workingDays: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      currency: { type: String, default: "INR" },
      dateFormat: { type: String, default: "DD-MM-YYYY" },
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }

);


// Fix: Check if model exists before creating it
const Organisation =
  mongoose.models.organisation ||
  mongoose.model("organisation", OrganisationSchema);

export default Organisation;