import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, default: () => `usr-${Date.now().toString(36)}`, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["Super Admin", "Admin", "User"], default: "User" },
    status: { type: String, enum: ["Active", "Inactive", "Suspended"], default: "Active" },
    avatar: { type: String, default: "US" },
    phone: { type: String, default: "" },
    loginPlace: { type: String, default: "Web / Local" },
    provider: { type: String, default: "Email" },
    lastLogin: { type: Date, default: Date.now },
    totalChecks: { type: Number, default: 0 },
    messagesChecked: { type: Number, default: 0 },
    threatsBlocked: { type: Number, default: 0 },
    sosTriggered: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model("User", userSchema)
