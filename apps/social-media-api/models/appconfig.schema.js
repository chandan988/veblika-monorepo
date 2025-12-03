import mongoose from "mongoose";

const appSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    appName: { type: String, required: true },
    appClientId: { type: String, required: true },
    appClientSecret: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const AppConfig = mongoose.model("AppConfig", appSchema);

export default AppConfig;
