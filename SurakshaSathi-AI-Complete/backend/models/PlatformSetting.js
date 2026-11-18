import mongoose from "mongoose"

const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    category: { type: String, default: "general" },
    updatedBy: { type: String, default: "admin" },
  },
  { timestamps: true }
)

export default mongoose.models.PlatformSetting || mongoose.model("PlatformSetting", platformSettingSchema)
