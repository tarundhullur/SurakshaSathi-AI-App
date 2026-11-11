import mongoose from "mongoose"

const adminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["Super Admin", "Admin", "User"], default: "Admin" },
    status: { type: String, enum: ["Active", "Inactive", "Suspended"], default: "Active" },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: "" },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.models.AdminUser || mongoose.model("AdminUser", adminUserSchema)
