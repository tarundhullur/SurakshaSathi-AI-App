import mongoose from "mongoose"

const sosAlertSchema = new mongoose.Schema(
  {
    alertId: { type: String, default: () => `sos-${Date.now().toString(36)}`, index: true },
    userEmail: { type: String, lowercase: true, trim: true, default: "anonymous" },
    userName: { type: String, default: "Citizen User" },
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    mapsLink: { type: String },
    contactsCount: { type: Number, default: 0 },
    status: { type: String, default: "Triggered" },
  },
  { timestamps: true }
)

export default mongoose.models.SosAlert || mongoose.model("SosAlert", sosAlertSchema)
