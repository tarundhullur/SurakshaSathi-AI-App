import mongoose from "mongoose"

const systemLogSchema = new mongoose.Schema(
  {
    logId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["system", "audit"], default: "system" },
    severity: {
      type: String,
      enum: ["INFO", "WARN", "ERROR", "CRITICAL"],
      default: "INFO",
    },
    category: {
      type: String,
      enum: ["auth", "user", "ride", "comparison", "settings", "system", "api"],
      default: "system",
    },
    message: { type: String, required: true },
    actor: { type: String, default: "System" },
    actorRole: { type: String, default: "System Service" },
    ip: { type: String, default: "127.0.0.1" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
)

export default mongoose.models.SystemLog || mongoose.model("SystemLog", systemLogSchema)
